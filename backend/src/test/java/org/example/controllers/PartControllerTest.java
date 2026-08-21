package org.example.controllers;
import java.math.BigDecimal;
import java.util.List;

import org.example.models.PageResult;
import org.example.models.Part;
import org.example.services.PartService;
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

class PartControllerTest {

    private PartService partService;
    private PartController partController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        partService = mock(PartService.class);
        partController = new PartController(partService);

        mockMvc = standaloneSetup(partController).build();
    }


    /*
     * Proves that every request parameter is bound
     * correctly and passed to PartService.
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


        Part part = new Part();
        part.setId(1);
        part.setName("RTX 4070");

        PageResult<Part> result =
                new PageResult<>(
                        List.of(part),
                        2,
                        12,
                        27L,
                        3
                );


        when(partService.search(
                "RTX",
                "GPU",
                "NVIDIA",
                new BigDecimal("800.00"),
                "price",
                "DESC",
                2,
                12,
                "alice",
                false
        )).thenReturn(result);


        mockMvc.perform(
                        get("/api/parts")
                                .param("search", "RTX")
                                .param("category", "GPU")
                                .param("brand", "NVIDIA")
                                .param("maxPrice", "800.00")
                                .param("sortBy", "price")
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
                                .value("RTX 4070")
                );


        verify(partService).search(
                "RTX",
                "GPU",
                "NVIDIA",
                new BigDecimal("800.00"),
                "price",
                "DESC",
                2,
                12,
                "alice",
                false
        );
    }


    /*
     * Proves the controller defaults:
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


        PageResult<Part> result =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );


        when(partService.search(
                null,
                null,
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
                        get("/api/parts")
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


        verify(partService).search(
                null,
                null,
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
     * Proves that ROLE_ADMIN is recognized
     * and forwarded to PartService as true.
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


        PageResult<Part> result =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );


        when(partService.search(
                null,
                null,
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
                        get("/api/parts")
                                .principal(auth)
                )
                .andExpect(status().isOk());


        verify(partService).search(
                null,
                null,
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
     * The controller should bind custom page/size
     * values rather than always using defaults.
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


        PageResult<Part> result =
                new PageResult<>(
                        List.of(),
                        4,
                        25,
                        102L,
                        5
                );


        when(partService.search(
                null,
                null,
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
                        get("/api/parts")
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


        verify(partService).search(
                null,
                null,
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
     * Existing /mine endpoint should remain
     * unchanged by pagination work.
     */
    @Test
    void findMine_remainsUnpaginated() throws Exception {

        Authentication auth = mock(Authentication.class);

        when(auth.getName()).thenReturn("alice");


        Part part = new Part();
        part.setId(7);
        part.setName("My GPU");


        when(partService.findMine("alice"))
                .thenReturn(List.of(part));


        mockMvc.perform(
                        get("/api/parts/mine")
                                .principal(auth)
                )
                .andExpect(status().isOk())

                .andExpect(
                        jsonPath("$[0].id")
                                .value(7)
                )

                .andExpect(
                        jsonPath("$[0].name")
                                .value("My GPU")
                );


        verify(partService)
                .findMine("alice");
    }
}