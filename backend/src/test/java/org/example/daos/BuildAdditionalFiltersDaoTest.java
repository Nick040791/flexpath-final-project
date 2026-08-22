package org.example.daos;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.example.models.Build;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class BuildAdditionalFiltersDaoTest {

    private JdbcTemplate jdbcTemplate;
    private BuildDao buildDao;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        buildDao = new BuildDao(jdbcTemplate);

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(1L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());
    }

    @Test
    void search_combinedFiltersUseExistsAndKeepAuthorizationFirst() {
        buildDao.search(
                "ai",
                "Private",
                "alice",
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

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> paramsCaptor = ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).queryForObject(
                sqlCaptor.capture(),
                eq(Long.class),
                paramsCaptor.capture()
        );

        String sql = sqlCaptor.getValue();

        int authIndex = sql.indexOf("(is_public = TRUE OR username = ?)");
        int ownerIndex = sql.indexOf("AND username = ?", authIndex + 1);
        int categoryIndex = sql.indexOf("AND p.category = ?");
        int partSearchIndex = sql.indexOf("p.name LIKE ? OR p.brand LIKE ? OR p.model LIKE ?");

        assertTrue(authIndex >= 0);
        assertTrue(ownerIndex > authIndex);
        assertTrue(categoryIndex > ownerIndex);
        assertTrue(partSearchIndex > categoryIndex);
        assertTrue(sql.contains("EXISTS ("));
        assertTrue(sql.contains("EXISTS (SELECT 1 FROM build_parts bp WHERE bp.build_id = builds.id)"));
        assertFalse(sql.contains("FROM builds JOIN build_parts"));

        assertArrayEquals(
                new Object[]{
                        "alice",
                        "%ai%",
                        "%ai%",
                        "alice",
                        "GPU",
                        "%RTX%",
                        "%RTX%",
                        "%RTX%"
                },
                paramsCaptor.getValue()
        );
    }

    @Test
    void search_emptyBuildFilterUsesNotExists() {
        buildDao.search(
                null,
                null,
                null,
                null,
                null,
                false,
                "name",
                "ASC",
                0,
                12,
                "admin",
                true
        );

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).queryForObject(
                sqlCaptor.capture(),
                eq(Long.class),
                any(Object[].class)
        );

        assertTrue(
                sqlCaptor.getValue().contains(
                        "NOT EXISTS (SELECT 1 FROM build_parts bp WHERE bp.build_id = builds.id)"
                )
        );
    }
}
