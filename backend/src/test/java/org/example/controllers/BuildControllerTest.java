package org.example.controllers;

import org.example.models.Build;
import org.example.models.Part;
import org.example.services.BuildService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BuildControllerTest {
    private BuildService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(BuildService.class);
        mvc = MockMvcBuilders.standaloneSetup(new BuildController(service)).build();
    }

    @Test
    void searchBindsFiltersAndAdminAuthority() throws Exception {
        when(service.search("gaming", "created_at", "DESC", "admin", true))
                .thenReturn(List.of(build(1, "Gaming PC")));

        mvc.perform(get("/api/builds")
                        .param("search", "gaming")
                        .param("sortBy", "created_at")
                        .param("direction", "DESC")
                        .principal(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Gaming PC"));

        verify(service).search("gaming", "created_at", "DESC", "admin", true);
    }

    @Test
    void mineAndFindByIdUseAuthenticatedUsername() throws Exception {
        when(service.findMine("alice")).thenReturn(List.of(build(2, "Mine")));
        when(service.findById(2, "alice", false)).thenReturn(build(2, "Mine"));

        mvc.perform(get("/api/builds/mine").principal(user()))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(2));
        mvc.perform(get("/api/builds/2").principal(user()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Mine"));
    }

    @Test
    void createReturnsCreatedAndDelegatesOwner() throws Exception {
        when(service.create(any(Build.class), eq("alice"))).thenAnswer(invocation -> {
            Build value = invocation.getArgument(0);
            value.setId(3);
            return value;
        });

        mvc.perform(post("/api/builds").principal(user())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"New Build\",\"description\":\"Test\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("New Build"));
    }

    @Test
    void updateAndDeletePassAdminFlag() throws Exception {
        when(service.update(eq(4), any(Build.class), eq("admin"), eq(true)))
                .thenReturn(build(4, "Updated"));

        mvc.perform(put("/api/builds/4").principal(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated"));
        mvc.perform(delete("/api/builds/4").principal(admin()))
                .andExpect(status().isNoContent()).andExpect(content().string(""));

        verify(service).delete(4, "admin", true);
    }

    @Test
    void addAndRemovePartReturnBodylessSuccessStatuses() throws Exception {
        mvc.perform(post("/api/builds/5/parts/9").param("quantity", "2").principal(admin()))
                .andExpect(status().isCreated()).andExpect(content().string(""));
        mvc.perform(delete("/api/builds/5/parts/9").principal(admin()))
                .andExpect(status().isNoContent()).andExpect(content().string(""));

        verify(service).addPartToBuild(5, 9, 2, "admin", true);
        verify(service).removePartFromBuild(5, 9, "admin", true);
    }

    @Test
    void getPartsReturnsSerializedParts() throws Exception {
        Part part = new Part();
        part.setId(9);
        part.setName("GPU");
        when(service.getPartsInBuild(5, "alice", false)).thenReturn(List.of(part));

        mvc.perform(get("/api/builds/5/parts").principal(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(9))
                .andExpect(jsonPath("$[0].name").value("GPU"));
    }

    private static Build build(int id, String name) {
        Build build = new Build();
        build.setId(id);
        build.setName(name);
        return build;
    }

    private static Authentication user() {
        return auth("alice", "USER");
    }

    private static Authentication admin() {
        return auth("admin", "ADMIN");
    }

    private static Authentication auth(String username, String authority) {
        return new UsernamePasswordAuthenticationToken(
                username, "ignored", List.of(new SimpleGrantedAuthority(authority)));
    }
}
