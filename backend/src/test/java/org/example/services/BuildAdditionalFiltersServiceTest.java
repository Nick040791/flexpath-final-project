package org.example.services;

import java.util.List;

import org.example.daos.BuildDao;
import org.example.daos.PartDao;
import org.example.models.Build;
import org.example.models.PageResult;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class BuildAdditionalFiltersServiceTest {

    private BuildDao buildDao;
    private BuildService buildService;

    @BeforeEach
    void setUp() {
        buildDao = mock(BuildDao.class);
        buildService = new BuildService(buildDao, mock(PartDao.class));
    }

    @Test
    void search_forwardsAllAdditionalFiltersToDao() {
        PageResult<Build> expected = new PageResult<>(
                List.of(),
                0,
                12,
                0L,
                0
        );

        when(buildDao.search(
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
        )).thenReturn(expected);

        PageResult<Build> actual = buildService.search(
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

        assertSame(expected, actual);

        verify(buildDao).search(
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

    @Test
    void search_additionalFiltersStillUseExistingPaginationValidation() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> buildService.search(
                        null,
                        null,
                        "alice",
                        "GPU",
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

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(buildDao);
    }
}
