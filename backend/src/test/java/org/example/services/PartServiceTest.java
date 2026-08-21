package org.example.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;

import org.example.daos.PartDao;
import org.example.models.PageResult;
import org.example.models.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class PartServiceTest {

    private PartDao partDao;
    private PartService partService;

    @BeforeEach
    void setUp() {
        partDao = mock(PartDao.class);
        partService = new PartService(partDao);
    }


    /*
     * Valid pagination should be delegated to the DAO
     * with every value unchanged.
     */
    @Test
    void search_validPagination_delegatesToDao() {

        List<Part> content = List.of(new Part());

        PageResult<Part> expectedResult =
                new PageResult<>(
                        content,
                        2,
                        12,
                        27L,
                        3
                );

        when(partDao.search(
                "RTX",
                "GPU",
                "NVIDIA",
                new BigDecimal("800.00"),
                "price",
                "ASC",
                2,
                12,
                "alice",
                false
        )).thenReturn(expectedResult);


        PageResult<Part> actualResult =
                partService.search(
                        "RTX",
                        "GPU",
                        "NVIDIA",
                        new BigDecimal("800.00"),
                        "price",
                        "ASC",
                        2,
                        12,
                        "alice",
                        false
                );


        verify(partDao).search(
                "RTX",
                "GPU",
                "NVIDIA",
                new BigDecimal("800.00"),
                "price",
                "ASC",
                2,
                12,
                "alice",
                false
        );

        assertSame(
                expectedResult,
                actualResult
        );
    }


    /*
     * Negative page numbers are invalid.
     *
     * The DAO should never be called when
     * service validation fails.
     */
    @Test
    void search_negativePage_throwsBadRequest() {

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () -> partService.search(
                                null,
                                null,
                                null,
                                null,
                                "name",
                                "ASC",
                                -1,
                                12,
                                "alice",
                                false
                        )
                );


        assertEquals(
                HttpStatus.BAD_REQUEST,
                exception.getStatusCode()
        );

        verifyNoInteractions(partDao);
    }


    /*
     * size=0 is invalid.
     */
    @Test
    void search_zeroSize_throwsBadRequest() {

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () -> partService.search(
                                null,
                                null,
                                null,
                                null,
                                "name",
                                "ASC",
                                0,
                                0,
                                "alice",
                                false
                        )
                );


        assertEquals(
                HttpStatus.BAD_REQUEST,
                exception.getStatusCode()
        );

        verifyNoInteractions(partDao);
    }


    /*
     * Maximum allowed size is 50.
     * size=51 must fail.
     */
    @Test
    void search_sizeAboveMaximum_throwsBadRequest() {

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () -> partService.search(
                                null,
                                null,
                                null,
                                null,
                                "name",
                                "ASC",
                                0,
                                51,
                                "alice",
                                false
                        )
                );


        assertEquals(
                HttpStatus.BAD_REQUEST,
                exception.getStatusCode()
        );

        verifyNoInteractions(partDao);
    }


    /*
     * Boundary test:
     * size=1 is valid.
     */
    @Test
    void search_minimumSize_isAllowed() {

        PageResult<Part> expectedResult =
                new PageResult<>(
                        List.of(),
                        0,
                        1,
                        0L,
                        0
                );

        when(partDao.search(
                null,
                null,
                null,
                null,
                "name",
                "ASC",
                0,
                1,
                "alice",
                false
        )).thenReturn(expectedResult);


        PageResult<Part> result =
                partService.search(
                        null,
                        null,
                        null,
                        null,
                        "name",
                        "ASC",
                        0,
                        1,
                        "alice",
                        false
                );


        assertSame(
                expectedResult,
                result
        );

        verify(partDao).search(
                null,
                null,
                null,
                null,
                "name",
                "ASC",
                0,
                1,
                "alice",
                false
        );
    }


    /*
     * Boundary test:
     * size=50 is valid.
     */
    @Test
    void search_maximumSize_isAllowed() {

        PageResult<Part> expectedResult =
                new PageResult<>(
                        List.of(),
                        0,
                        50,
                        0L,
                        0
                );

        when(partDao.search(
                null,
                null,
                null,
                null,
                "name",
                "ASC",
                0,
                50,
                "alice",
                false
        )).thenReturn(expectedResult);


        PageResult<Part> result =
                partService.search(
                        null,
                        null,
                        null,
                        null,
                        "name",
                        "ASC",
                        0,
                        50,
                        "alice",
                        false
                );


        assertSame(
                expectedResult,
                result
        );

        verify(partDao).search(
                null,
                null,
                null,
                null,
                "name",
                "ASC",
                0,
                50,
                "alice",
                false
        );
    }


    /*
     * Verify that admin status and username
     * are passed to the DAO unchanged.
     */
    @Test
    void search_admin_passesSecurityScopeToDao() {

        PageResult<Part> expectedResult =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );

        when(partDao.search(
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
        )).thenReturn(expectedResult);


        partService.search(
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


        verify(partDao).search(
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
     * The service should return the pagination
     * metadata produced by the DAO unchanged.
     */
    @Test
    void search_returnsDaoPaginationMetadataUnchanged() {

        PageResult<Part> daoResult =
                new PageResult<>(
                        List.of(new Part()),
                        3,
                        12,
                        43L,
                        4
                );

        when(partDao.search(
                null,
                null,
                null,
                null,
                "name",
                "ASC",
                3,
                12,
                "alice",
                false
        )).thenReturn(daoResult);


        PageResult<Part> result =
                partService.search(
                        null,
                        null,
                        null,
                        null,
                        "name",
                        "ASC",
                        3,
                        12,
                        "alice",
                        false
                );


        assertEquals(
                3,
                result.getPage()
        );

        assertEquals(
                12,
                result.getSize()
        );

        assertEquals(
                43L,
                result.getTotalElements()
        );

        assertEquals(
                4,
                result.getTotalPages()
        );

        assertEquals(
                1,
                result.getContent().size()
        );
    }
}