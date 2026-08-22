package org.example.controllers;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

import java.util.List;

import org.example.models.Build;
import org.example.models.PageResult;
import org.example.services.BuildService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

class BuildAdditionalFiltersControllerTest {

    private BuildService buildService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        buildService = mock(BuildService.class);
        mockMvc = standaloneSetup(new BuildController(buildService)).build();
    }

    @Test
    void search_bindsAndForwardsAdditionalBuildFilters() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("alice");
        when(auth.getAuthorities()).thenAnswer(
                invocation -> List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        PageResult<Build> result = new PageResult<>(
                List.of(),
                0,
                12,
                0L,
                0
        );

        when(buildService.search(
                "ai",
                "Public",
                "admin",
                "GPU",
                "RTX",
                true,
                "created_at",
                "DESC",
                0,
                12,
                "alice",
                false
        )).thenReturn(result);

        mockMvc.perform(
                        get("/api/builds")
                                .param("search", "ai")
                                .param("visibility", "Public")
                                .param("owner", "admin")
                                .param("partCategory", "GPU")
                                .param("partSearch", "RTX")
                                .param("hasParts", "true")
                                .param("sortBy", "created_at")
                                .param("direction", "DESC")
                                .param("page", "0")
                                .param("size", "12")
                                .principal(auth)
                )
                .andExpect(status().isOk());

        verify(buildService).search(
                "ai",
                "Public",
                "admin",
                "GPU",
                "RTX",
                true,
                "created_at",
                "DESC",
                0,
                12,
                "alice",
                false
        );
    }
}
