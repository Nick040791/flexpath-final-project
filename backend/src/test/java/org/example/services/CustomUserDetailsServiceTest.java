package org.example.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.example.daos.UserDao;
import org.example.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class CustomUserDetailsServiceTest {

    private UserDao userDao;
    private CustomUserDetailsService service;

    @BeforeEach
    void setUp() {
        userDao = mock(UserDao.class);
        service = new CustomUserDetailsService(userDao);
    }

    @Test
    void loadUserByUsername_existingUser_mapsCredentialsRolesAndAccountFlags() {
        User user = new User("alice", "$2a$10$hash");
        when(userDao.getUserByUsername("alice")).thenReturn(user);
        when(userDao.getRoles("alice")).thenReturn(List.of("USER", "ADMIN"));

        UserDetails result = service.loadUserByUsername("alice");

        assertEquals("alice", result.getUsername());
        assertEquals("$2a$10$hash", result.getPassword());
        assertEquals(2, result.getAuthorities().size());
        assertTrue(result.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("USER")));
        assertTrue(result.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN")));
        assertTrue(result.isAccountNonExpired());
        assertTrue(result.isAccountNonLocked());
        assertTrue(result.isCredentialsNonExpired());
        assertTrue(result.isEnabled());

        verify(userDao).getUserByUsername("alice");
        verify(userDao).getRoles("alice");
    }

    @Test
    void loadUserByUsername_userWithNoRoles_returnsEmptyAuthorities() {
        User user = new User("alice", "hash");
        when(userDao.getUserByUsername("alice")).thenReturn(user);
        when(userDao.getRoles("alice")).thenReturn(List.of());

        UserDetails result = service.loadUserByUsername("alice");

        assertTrue(result.getAuthorities().isEmpty());
    }

    @Test
    void loadUserByUsername_missingUser_throwsUsernameNotFoundAndDoesNotLoadRoles() {
        when(userDao.getUserByUsername("missing")).thenReturn(null);

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> service.loadUserByUsername("missing"));

        assertEquals("User not found.", exception.getMessage());
        verify(userDao).getUserByUsername("missing");
        verify(userDao, never()).getRoles(anyString());
    }
}
