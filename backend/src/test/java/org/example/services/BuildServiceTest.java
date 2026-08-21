package org.example.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.example.daos.BuildDao;
import org.example.daos.PartDao;
import org.example.models.Build;
import org.example.models.PageResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class BuildServiceTest {

    private BuildDao buildDao;
    private PartDao partDao;
    private BuildService buildService;

    @BeforeEach
    void setUp() {
        buildDao = mock(BuildDao.class);
        partDao = mock(PartDao.class);

        buildService = new BuildService(
                buildDao,
                partDao
        );
    }


    /*
     * Valid pagination should be delegated
     * to BuildDao unchanged.
     */
    @Test
    void search_validPagination_delegatesToDao() {

        List<Build> content =
                List.of(new Build());

        PageResult<Build> expectedResult =
                new PageResult<>(
                        content,
                        2,
                        12,
                        27L,
                        3
                );


        when(buildDao.search(
                "gaming",
                "Public",
                "created_at",
                "DESC",
                2,
                12,
                "alice",
                false
        )).thenReturn(expectedResult);


        PageResult<Build> actualResult =
                buildService.search(
                        "gaming",
                        "Public",
                        "created_at",
                        "DESC",
                        2,
                        12,
                        "alice",
                        false
                );


        verify(buildDao).search(
                "gaming",
                "Public",
                "created_at",
                "DESC",
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
     * Negative pages are invalid.
     */
    @Test
    void search_negativePage_throwsBadRequest() {

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () -> buildService.search(
                                null,
                                "All",
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


        verifyNoInteractions(buildDao);
    }


    /*
     * size=0 is invalid.
     */
    @Test
    void search_zeroSize_throwsBadRequest() {

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () -> buildService.search(
                                null,
                                "All",
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


        verifyNoInteractions(buildDao);
    }


    /*
     * size greater than 50 is invalid.
     */
    @Test
    void search_sizeAboveMaximum_throwsBadRequest() {

        ResponseStatusException exception =
                assertThrows(
                        ResponseStatusException.class,
                        () -> buildService.search(
                                null,
                                "All",
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


        verifyNoInteractions(buildDao);
    }


    /*
     * Boundary:
     * size=1 is valid.
     */
    @Test
    void search_minimumSize_isAllowed() {

        PageResult<Build> expectedResult =
                new PageResult<>(
                        List.of(),
                        0,
                        1,
                        0L,
                        0
                );


        when(buildDao.search(
                null,
                "All",
                "name",
                "ASC",
                0,
                1,
                "alice",
                false
        )).thenReturn(expectedResult);


        PageResult<Build> result =
                buildService.search(
                        null,
                        "All",
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


        verify(buildDao).search(
                null,
                "All",
                "name",
                "ASC",
                0,
                1,
                "alice",
                false
        );
    }


    /*
     * Boundary:
     * size=50 is valid.
     */
    @Test
    void search_maximumSize_isAllowed() {

        PageResult<Build> expectedResult =
                new PageResult<>(
                        List.of(),
                        0,
                        50,
                        0L,
                        0
                );


        when(buildDao.search(
                null,
                "All",
                "name",
                "ASC",
                0,
                50,
                "alice",
                false
        )).thenReturn(expectedResult);


        PageResult<Build> result =
                buildService.search(
                        null,
                        "All",
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


        verify(buildDao).search(
                null,
                "All",
                "name",
                "ASC",
                0,
                50,
                "alice",
                false
        );
    }


    /*
     * Username and admin status must be
     * passed to the DAO unchanged.
     */
    @Test
    void search_admin_passesSecurityScopeToDao() {

        PageResult<Build> expectedResult =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );


        when(buildDao.search(
                null,
                "Private",
                "name",
                "ASC",
                0,
                12,
                "adminUser",
                true
        )).thenReturn(expectedResult);


        buildService.search(
                null,
                "Private",
                "name",
                "ASC",
                0,
                12,
                "adminUser",
                true
        );


        verify(buildDao).search(
                null,
                "Private",
                "name",
                "ASC",
                0,
                12,
                "adminUser",
                true
        );
    }


    /*
     * The Build visibility value must reach
     * the DAO unchanged.
     */
    @Test
    void search_visibility_isPassedToDao() {

        PageResult<Build> expectedResult =
                new PageResult<>(
                        List.of(),
                        0,
                        12,
                        0L,
                        0
                );


        when(buildDao.search(
                "gaming",
                "Private",
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        )).thenReturn(expectedResult);


        buildService.search(
                "gaming",
                "Private",
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        );


        verify(buildDao).search(
                "gaming",
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
     * The service should return DAO pagination
     * metadata unchanged.
     */
    @Test
    void search_returnsDaoPaginationMetadataUnchanged() {

        PageResult<Build> daoResult =
                new PageResult<>(
                        List.of(new Build()),
                        3,
                        12,
                        43L,
                        4
                );


        when(buildDao.search(
                null,
                "All",
                "name",
                "ASC",
                3,
                12,
                "alice",
                false
        )).thenReturn(daoResult);


        PageResult<Build> result =
                buildService.search(
                        null,
                        "All",
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