package org.example.controllers;

import org.example.models.Part;
import org.example.services.PartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PartControllerTest {
    private PartService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(PartService.class);
        mvc = MockMvcBuilders.standaloneSetup(new PartController(service)).build();
    }

    @Test
    void searchBindsAllFiltersAndRoleAdminAuthority() throws Exception {
        when(service.search("rtx", "GPU", "NVIDIA", new BigDecimal("700"),
                "price", "DESC", "admin", true)).thenReturn(List.of(part(1, "RTX")));

        mvc.perform(get("/api/parts").principal(auth("admin", "ROLE_ADMIN"))
                        .param("search", "rtx").param("category", "GPU")
                        .param("brand", "NVIDIA").param("maxPrice", "700")
                        .param("sortBy", "price").param("direction", "DESC"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("RTX"));
    }

    @Test
    void mineAndFindByIdUseAuthenticatedUser() throws Exception {
        when(service.findMine("alice")).thenReturn(List.of(part(2, "Mine")));
        when(service.findById(2, "alice", false)).thenReturn(part(2, "Mine"));

        mvc.perform(get("/api/parts/mine").principal(user()))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(2));
        mvc.perform(get("/api/parts/2").principal(user()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Mine"));
    }

    @Test
    void createReturnsCreated() throws Exception {
        when(service.create(any(Part.class), eq("alice"))).thenAnswer(invocation -> {
            Part value = invocation.getArgument(0);
            value.setId(3);
            return value;
        });

        mvc.perform(post("/api/parts").principal(user())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"CPU\",\"price\":199.99}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(3));
    }

    @Test
    void updateAndDeleteDelegateAdminContext() throws Exception {
        when(service.update(eq(4), any(Part.class), eq("admin"), eq(true)))
                .thenReturn(part(4, "Updated"));

        mvc.perform(put("/api/parts/4").principal(auth("admin", "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated"));
        mvc.perform(delete("/api/parts/4").principal(auth("admin", "ADMIN")))
                .andExpect(status().isNoContent()).andExpect(content().string(""));

        verify(service).delete(4, "admin", true);
    }

    private static Part part(int id, String name) {
        Part part = new Part();
        part.setId(id);
        part.setName(name);
        return part;
    }

    private static Authentication user() {
        return auth("alice", "USER");
    }

    private static Authentication auth(String username, String authority) {
        return new UsernamePasswordAuthenticationToken(
                username, "ignored", List.of(new SimpleGrantedAuthority(authority)));
    }
}
