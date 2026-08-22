package org.example.daos;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.sql.ResultSet;
import java.util.List;

import javax.sql.DataSource;

import org.example.exceptions.DaoException;
import org.example.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class UserDaoTest {

    private JdbcTemplate jdbcTemplate;
    private PasswordEncoder passwordEncoder;
    private UserDao userDao;

    @BeforeEach
    void setUp() {
        DataSource dataSource = mock(DataSource.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jdbcTemplate = mock(JdbcTemplate.class);
        userDao = new UserDao(dataSource, passwordEncoder);
        ReflectionTestUtils.setField(userDao, "jdbcTemplate", jdbcTemplate);
    }

    @SuppressWarnings("unchecked")
    @Test
    void getUsers_returnsUsersFromJdbcTemplate() {
        List<User> expected = List.of(new User("alice", "hash"), new User("bob", "hash2"));
        when(jdbcTemplate.query(eq("SELECT * FROM users ORDER BY username;"), any(RowMapper.class)))
                .thenReturn(expected);

        List<User> result = userDao.getUsers();

        assertSame(expected, result);
    }

    @SuppressWarnings("unchecked")
    @Test
    void getUserByUsername_existingUser_returnsMappedUser() {
        User expected = new User("alice", "hash");
        when(jdbcTemplate.queryForObject(
                eq("SELECT * FROM users WHERE username = ?"),
                any(RowMapper.class),
                eq("alice")))
                .thenReturn(expected);

        assertSame(expected, userDao.getUserByUsername("alice"));
    }

    @SuppressWarnings("unchecked")
    @Test
    void getUserByUsername_missingUser_returnsNull() {
        when(jdbcTemplate.queryForObject(
                eq("SELECT * FROM users WHERE username = ?"),
                any(RowMapper.class),
                eq("missing")))
                .thenThrow(new EmptyResultDataAccessException(1));

        assertNull(userDao.getUserByUsername("missing"));
    }

    @SuppressWarnings("unchecked")
    @Test
    void createUser_hashesPasswordInsertsAndReloadsUser() {
        User input = new User("alice", "plain-text");
        User stored = new User("alice", "encoded-hash");
        when(passwordEncoder.encode("plain-text")).thenReturn("encoded-hash");
        when(jdbcTemplate.update(
                "INSERT INTO users (username, password) VALUES (?,?);",
                "alice",
                "encoded-hash"))
                .thenReturn(1);
        when(jdbcTemplate.queryForObject(
                eq("SELECT * FROM users WHERE username = ?"),
                any(RowMapper.class),
                eq("alice")))
                .thenReturn(stored);

        User result = userDao.createUser(input);

        assertSame(stored, result);
        verify(passwordEncoder).encode("plain-text");
        verify(jdbcTemplate).update(
                "INSERT INTO users (username, password) VALUES (?,?);",
                "alice",
                "encoded-hash");
    }

    @Test
    void createUser_emptyResultFailure_isWrappedAsDaoException() {
        User input = new User("alice", "plain-text");
        when(passwordEncoder.encode("plain-text")).thenReturn("encoded-hash");
        when(jdbcTemplate.update(
                "INSERT INTO users (username, password) VALUES (?,?);",
                "alice",
                "encoded-hash"))
                .thenThrow(new EmptyResultDataAccessException(1));

        DaoException exception = assertThrows(DaoException.class, () -> userDao.createUser(input));

        assertEquals("Failed to create user.", exception.getMessage());
    }

    @SuppressWarnings("unchecked")
    @Test
    void updatePassword_hashesPasswordUpdatesAndReloadsUser() {
        User input = new User("alice", "new-password");
        User stored = new User("alice", "new-hash");
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");
        when(jdbcTemplate.update(
                "UPDATE users SET password = ? WHERE username = ?",
                "new-hash",
                "alice"))
                .thenReturn(1);
        when(jdbcTemplate.queryForObject(
                eq("SELECT * FROM users WHERE username = ?"),
                any(RowMapper.class),
                eq("alice")))
                .thenReturn(stored);

        User result = userDao.updatePassword(input);

        assertSame(stored, result);
        verify(passwordEncoder).encode("new-password");
    }

    @Test
    void updatePassword_zeroRows_throwsDaoException() {
        User input = new User("alice", "new-password");
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");
        when(jdbcTemplate.update(
                "UPDATE users SET password = ? WHERE username = ?",
                "new-hash",
                "alice"))
                .thenReturn(0);

        DaoException exception = assertThrows(DaoException.class, () -> userDao.updatePassword(input));

        assertEquals("Zero rows affected, expected at least one.", exception.getMessage());
    }

    @Test
    void deleteUser_returnsAffectedRowCount() {
        when(jdbcTemplate.update("DELETE FROM users WHERE username = ? ", "alice")).thenReturn(1);

        assertEquals(1, userDao.deleteUser("alice"));
    }

    @Test
    void getRoles_returnsRolesFromJdbcTemplate() {
        List<String> roles = List.of("USER", "ADMIN");
        when(jdbcTemplate.queryForList(
                "SELECT role FROM roles WHERE username = ?;",
                String.class,
                "alice"))
                .thenReturn(roles);

        assertSame(roles, userDao.getRoles("alice"));
    }

    @Test
    void addRole_insertsRoleThenReturnsCurrentRoles() {
        when(jdbcTemplate.update(
                "INSERT INTO roles (username, role) VALUES (?,?)",
                "alice",
                "ADMIN"))
                .thenReturn(1);
        when(jdbcTemplate.queryForList(
                "SELECT role FROM roles WHERE username = ?;",
                String.class,
                "alice"))
                .thenReturn(List.of("USER", "ADMIN"));

        List<String> result = userDao.addRole("alice", "ADMIN");

        assertEquals(List.of("USER", "ADMIN"), result);
    }

    @Test
    void addRole_duplicateInsertStillReturnsExistingRoles() {
        when(jdbcTemplate.update(
                "INSERT INTO roles (username, role) VALUES (?,?)",
                "alice",
                "USER"))
                .thenThrow(new DuplicateKeyException("duplicate"));
        when(jdbcTemplate.queryForList(
                "SELECT role FROM roles WHERE username = ?;",
                String.class,
                "alice"))
                .thenReturn(List.of("USER"));

        assertEquals(List.of("USER"), userDao.addRole("alice", "USER"));
    }

    @Test
    void deleteRole_returnsAffectedRowCount() {
        when(jdbcTemplate.update(
                "DELETE FROM roles WHERE username = ? AND role = ?",
                "alice",
                "ADMIN"))
                .thenReturn(1);

        assertEquals(1, userDao.deleteRole("alice", "ADMIN"));
    }

    @Test
    void mapToUser_mapsUsernameAndPasswordColumns() throws Exception {
        ResultSet resultSet = mock(ResultSet.class);
        when(resultSet.getString("username")).thenReturn("alice");
        when(resultSet.getString("password")).thenReturn("hash");

        User result = ReflectionTestUtils.invokeMethod(userDao, "mapToUser", resultSet, 0);

        assertNotNull(result);
        assertEquals("alice", result.getUsername());
        assertEquals("hash", result.getPassword());
    }
}
