package org.example.daos;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class BuildDaoTest {

    private JdbcTemplate jdbcTemplate;
    private BuildDao buildDao;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        buildDao = new BuildDao(jdbcTemplate);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenReturn(java.util.List.of());
    }

    @Test
    void searchAddsPublicVisibilityAfterKeywordCondition() {
        buildDao.search("gaming", "public", "created_at", "DESC");

        String sql = capturedSql();
        assertTrue(sql.contains("AND (name LIKE ? OR description LIKE ?)"));
        assertTrue(sql.contains("AND is_public = TRUE"));
        assertTrue(sql.indexOf("description LIKE ?") < sql.indexOf("is_public = TRUE"));
        assertTrue(sql.indexOf("is_public = TRUE") < sql.indexOf("ORDER BY"));
    }

    @Test
    void searchAddsPrivateVisibilityCaseInsensitively() {
        buildDao.search(null, "PRIVATE", "name", "ASC");

        String sql = capturedSql();
        assertTrue(sql.contains("AND is_public = FALSE"));
        assertFalse(sql.contains("is_public = TRUE"));
    }

    @Test
    void searchIgnoresBlankAndUnknownVisibility() {
        buildDao.search(null, "   ", "name", "ASC");
        assertFalse(capturedSql().contains("is_public"));

        clearInvocations(jdbcTemplate);
        buildDao.search(null, "friends-only", "name", "ASC");
        assertFalse(capturedSql().contains("is_public"));
    }

    private String capturedSql() {
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).query(sql.capture(), any(RowMapper.class), any(Object[].class));
        return sql.getValue();
    }
}