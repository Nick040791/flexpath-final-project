package org.example.controllers;

import org.example.daos.UserDao;
import org.example.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerTest {
    private UserDao userDao;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        userDao = mock(UserDao.class);
        UserController controller = new UserController();
        ReflectionTestUtils.setField(controller, "userDao", userDao);
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getAllAndGetOneReturnUsers() throws Exception {
        when(userDao.getUsers()).thenReturn(List.of(new User("admin", "encoded")));
        when(userDao.getUserByUsername("admin")).thenReturn(new User("admin", "encoded"));

        mvc.perform(get("/api/users")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"));
        mvc.perform(get("/api/users/admin")).andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void createReturnsCreatedUser() throws Exception {
        when(userDao.createUser(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"bob\",\"password\":\"secret\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.username").value("bob"));
    }

    @Test
    void updatePasswordReturnsNotFoundForUnknownUser() throws Exception {
        when(userDao.getUserByUsername("missing")).thenReturn(null);

        mvc.perform(put("/api/users/missing/password").content("new-password"))
                .andExpect(status().isNotFound());
        verify(userDao, never()).updatePassword(any());
    }

    @Test
    void updatePasswordAndDeleteDelegateToDao() throws Exception {
        User user = new User("bob", "old");
        when(userDao.getUserByUsername("bob")).thenReturn(user);
        when(userDao.updatePassword(user)).thenReturn(user);
        when(userDao.deleteUser("bob")).thenReturn(1);

        mvc.perform(put("/api/users/bob/password").content("new-password"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.password").value("new-password"));
        mvc.perform(delete("/api/users/bob"))
                .andExpect(status().isOk()).andExpect(content().string("1"));
    }

    @Test
    void roleEndpointsNormalizeRoleNames() throws Exception {
        when(userDao.getRoles("bob")).thenReturn(List.of("USER"));
        when(userDao.addRole("bob", "ADMIN")).thenReturn(List.of("USER", "ADMIN"));
        when(userDao.deleteRole("bob", "ADMIN")).thenReturn(1);

        mvc.perform(get("/api/users/bob/roles"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0]").value("USER"));
        mvc.perform(post("/api/users/bob/roles").content("admin"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[1]").value("ADMIN"));
        mvc.perform(delete("/api/users/bob/roles/admin"))
                .andExpect(status().isOk()).andExpect(content().string("1"));
    }

    @Test
    void deleteMissingRoleReturnsNotFound() throws Exception {
        when(userDao.deleteRole("bob", "ADMIN")).thenReturn(0);

        mvc.perform(delete("/api/users/bob/roles/admin"))
                .andExpect(status().isNotFound());
    }
}