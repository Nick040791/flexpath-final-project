package org.example.controllers;
import java.util.List;

import org.example.models.Build;
import org.example.models.PageResult;
import org.example.services.BuildService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class BuildControllerTest {

    private BuildService buildService;
    private BuildController buildController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        buildService = mock(BuildService.class);
        buildController = new BuildController(buildService);

        mockMvc = standaloneSetup(buildController).build();
    }


    /*
     * Proves all Build search parameters are
     * bound and passed to BuildService correctly.
     */
    @Test
    void search_bindsAllRequestParameters() throws Exception {

        Authentication auth = mock(Authentication.class);

        when(auth.getName()).thenReturn("alice");

        when(auth.getAuthorities()).thenAnswer(
                invocation -> List.of(
                        new SimpleGrantedAuthority("ROLE_USER")
                )
        );


        Build build = new Build();
        build.setId(1);
        build.setName("Gaming Build");


        PageResult<Build> result =
                new PageResult<>(
                        List.of(build),
                        2,
                        12,
                        27L,
                        3
                );


        when(buildService.search(
                "gaming",
                "Public",
                "created_at",
                "DESC",
                2,
                12,
                "alice",
                false
        )).thenReturn(result);


        mockMvc.perform(
                        get("/api/builds")
                                .param("search", "gaming")
                                .param("visibility", "Public")
                                .param("sortBy", "created_at")
                                .param("direction", "DESC")
                                .param("page", "2")
                                .param("size", "12")
                                .principal(auth)
                )
                .andExpect(status().isOk())

                .andExpect(
                        jsonPath("$.page")
                                .value(2)
                )

                .andExpect(
                        jsonPath("$.size")
                                .value(12)
                )

                .andExpect(
                        jsonPath("$.totalElements")
                                .value(27)
                )

                .andExpect(
                        jsonPath("$.totalPages")
                                .value(3)
                )

                .andExpect(
                        jsonPath("$.content[0].id")
                                .value(1)
                )

                .andExpect(
                        jsonPath("$.content[0].name")
                                .value("Gaming Build")
                );


        verify(buildService).search(
                "gaming",
                "Public",
                "created_at",
                "DESC",
                2,
                12,
                "alice",
                false
        );
    }


    /*
     * Proves controller defaults:
     *
     * sortBy=name
     * direction=ASC
     * page=0
     * size=12
     */
    @Test
    void search_missingOptionalParameters_usesDefaults() throws Exception {

        Authentication auth = mock(Authentication.class);

        when(auth.getName()).thenReturn("alice");

        when(auth.getAuthorities()).thenAnswer(
                invocation -> List.of(
                        new SimpleGrantedAuthority("ROLE_USER")
                )
        );


        PageResult<Build> result =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );


        when(buildService.search(
                null,
                null,
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        )).thenReturn(result);


        mockMvc.perform(
                        get("/api/builds")
                                .principal(auth)
                )
                .andExpect(status().isOk())

                .andExpect(
                        jsonPath("$.page")
                                .value(0)
                )

                .andExpect(
                        jsonPath("$.size")
                                .value(12)
                )

                .andExpect(
                        jsonPath("$.totalElements")
                                .value(0)
                )

                .andExpect(
                        jsonPath("$.totalPages")
                                .value(0)
                )

                .andExpect(
                        jsonPath("$.content")
                                .isArray()
                );


        verify(buildService).search(
                null,
                null,
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        );
    }


    /*
     * Proves ROLE_ADMIN is recognized
     * and passed to BuildService.
     */
    @Test
    void search_admin_passesAdminStatusToService() throws Exception {

        Authentication auth = mock(Authentication.class);

        when(auth.getName()).thenReturn("adminUser");

        when(auth.getAuthorities()).thenAnswer(
                invocation -> List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN")
                )
        );


        PageResult<Build> result =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );


        when(buildService.search(
                null,
                null,
                "name",
                "ASC",
                0,
                12,
                "adminUser",
                true
        )).thenReturn(result);


        mockMvc.perform(
                        get("/api/builds")
                                .principal(auth)
                )
                .andExpect(status().isOk());


        verify(buildService).search(
                null,
                null,
                "name",
                "ASC",
                0,
                12,
                "adminUser",
                true
        );
    }


    /*
     * Custom pagination values should be passed
     * rather than replaced by defaults.
     */
    @Test
    void search_customPagination_passesPageAndSizeToService() throws Exception {

        Authentication auth = mock(Authentication.class);

        when(auth.getName()).thenReturn("alice");

        when(auth.getAuthorities()).thenAnswer(
                invocation -> List.of(
                        new SimpleGrantedAuthority("ROLE_USER")
                )
        );


        PageResult<Build> result =
                new PageResult<>(
                        List.of(),
                        4,
                        25,
                        102L,
                        5
                );


        when(buildService.search(
                null,
                null,
                "name",
                "ASC",
                4,
                25,
                "alice",
                false
        )).thenReturn(result);


        mockMvc.perform(
                        get("/api/builds")
                                .param("page", "4")
                                .param("size", "25")
                                .principal(auth)
                )
                .andExpect(status().isOk())

                .andExpect(
                        jsonPath("$.page")
                                .value(4)
                )

                .andExpect(
                        jsonPath("$.size")
                                .value(25)
                );


        verify(buildService).search(
                null,
                null,
                "name",
                "ASC",
                4,
                25,
                "alice",
                false
        );
    }


    /*
     * Visibility must survive HTTP binding.
     */
    @Test
    void search_privateVisibility_passesVisibilityToService() throws Exception {

        Authentication auth = mock(Authentication.class);

        when(auth.getName()).thenReturn("alice");

        when(auth.getAuthorities()).thenAnswer(
                invocation -> List.of(
                        new SimpleGrantedAuthority("ROLE_USER")
                )
        );


        PageResult<Build> result =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );


        when(buildService.search(
                null,
                "Private",
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        )).thenReturn(result);


        mockMvc.perform(
                        get("/api/builds")
                                .param("visibility", "Private")
                                .principal(auth)
                )
                .andExpect(status().isOk());


        verify(buildService).search(
                null,
                "Private",
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        );
    }


    /*
     * Existing /mine endpoint remains
     * unpaginated.
     */
    @Test
    void findMine_remainsUnpaginated() throws Exception {

        Authentication auth = mock(Authentication.class);

        when(auth.getName()).thenReturn("alice");


        Build build = new Build();
        build.setId(7);
        build.setName("My Build");


        when(buildService.findMine("alice"))
                .thenReturn(List.of(build));


        mockMvc.perform(
                        get("/api/builds/mine")
                                .principal(auth)
                )
                .andExpect(status().isOk())

                .andExpect(
                        jsonPath("$[0].id")
                                .value(7)
                )

                .andExpect(
                        jsonPath("$[0].name")
                                .value("My Build")
                );


        verify(buildService)
                .findMine("alice");
    }
}