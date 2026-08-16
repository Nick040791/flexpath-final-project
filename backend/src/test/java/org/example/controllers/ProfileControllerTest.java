package org.example.controllers;

import org.example.daos.UserDao;
import org.example.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProfileControllerTest {
    private UserDao userDao;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        userDao = mock(UserDao.class);
        ProfileController controller = new ProfileController();
        ReflectionTestUtils.setField(controller, "userDao", userDao);
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void profileAndRolesUseCurrentPrincipal() throws Exception {
        when(userDao.getUserByUsername("alice")).thenReturn(new User("alice", "encoded"));
        when(userDao.getRoles("alice")).thenReturn(List.of("USER"));

        mvc.perform(get("/api/profile").principal(alice()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("alice"));
        mvc.perform(get("/api/profile/roles").principal(alice()))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0]").value("USER"));
    }

    @Test
    void changePasswordUpdatesCurrentUser() throws Exception {
        User user = new User("alice", "old");
        when(userDao.getUserByUsername("alice")).thenReturn(user);
        when(userDao.updatePassword(user)).thenReturn(user);

        mvc.perform(put("/api/profile/change-password").principal(alice()).content("new-password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.password").value("new-password"));

        verify(userDao).updatePassword(argThat(value -> "new-password".equals(value.getPassword())));
    }

    private static Principal alice() {
        return () -> "alice";
    }
}