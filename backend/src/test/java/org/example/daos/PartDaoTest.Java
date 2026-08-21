package org.example.daos;

import org.example.models.PageResult;
import org.example.models.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartDaoTest {

    private JdbcTemplate jdbcTemplate;
    private PartDao partDao;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        partDao = new PartDao(jdbcTemplate);
    }


    /*
     * Proves:
     * - normal-user authorization is included
     * - search/category/brand/maxPrice are included
     * - COUNT uses the authorized + filtered WHERE clause
     * - page=2,size=12 produces OFFSET 24
     * - LIMIT equals requested size
     * - metadata is calculated correctly
     */
    @Test
    void search_normalUser_appliesFiltersAuthorizationAndPagination() {

        BigDecimal maxPrice = new BigDecimal("800.00");

        Part part = new Part();

        List<Part> returnedContent = List.of(part);

        // Pretend COUNT(*) found 27 authorized matching rows.
        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(27L);

        // Pretend the paginated SELECT returned one row.
        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        )).thenReturn(returnedContent);


        PageResult<Part> result = partDao.search(
                "RTX",
                "GPU",
                "NVIDIA",
                maxPrice,
                "price",
                "ASC",
                2,
                12,
                "alice",
                false
        );


        /*
         * Capture COUNT query.
         */
        ArgumentCaptor<String> countSqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> countParamsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).queryForObject(
                countSqlCaptor.capture(),
                eq(Long.class),
                countParamsCaptor.capture()
        );

        String countSql = countSqlCaptor.getValue();
        Object[] countParams = countParamsCaptor.getValue();


        // Authorization must be present before pagination.
        assertTrue(
                countSql.contains(
                        "(is_public = TRUE OR username = ?)"
                )
        );

        // Search must be present.
        assertTrue(
                countSql.contains(
                        "(name LIKE ? OR description LIKE ?)"
                )
        );

        // Filters must be present.
        assertTrue(countSql.contains("category = ?"));
        assertTrue(countSql.contains("brand = ?"));
        assertTrue(countSql.contains("price <= ?"));


        /*
         * COUNT should contain only authorization/filter parameters.
         *
         * No LIMIT or OFFSET parameters belong here.
         */
        assertArrayEquals(
                new Object[]{
                        "alice",
                        "%RTX%",
                        "%RTX%",
                        "GPU",
                        "NVIDIA",
                        maxPrice
                },
                countParams
        );


        /*
         * Capture paginated SELECT query.
         */
        ArgumentCaptor<String> dataSqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> dataParamsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).query(
                dataSqlCaptor.capture(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                dataParamsCaptor.capture()
        );

        String dataSql = dataSqlCaptor.getValue();
        Object[] dataParams = dataParamsCaptor.getValue();


        /*
         * SELECT should contain exactly the same logical WHERE
         * conditions used by COUNT.
         */
        String countWhere =
                countSql.substring(
                        "SELECT COUNT(*)".length()
                );

        assertTrue(
                dataSql.startsWith(
                        "SELECT *" + countWhere
                )
        );


        // Requested sorting should be preserved.
        assertTrue(
                dataSql.contains(
                        "ORDER BY price ASC"
                )
        );

        // Pagination must happen in SQL.
        assertTrue(
                dataSql.contains(
                        "LIMIT ? OFFSET ?"
                )
        );


        /*
         * Data SELECT receives:
         *
         * authorization/filter params
         * +
         * LIMIT
         * +
         * OFFSET
         *
         * page 2 * size 12 = offset 24
         */
        assertArrayEquals(
                new Object[]{
                        "alice",
                        "%RTX%",
                        "%RTX%",
                        "GPU",
                        "NVIDIA",
                        maxPrice,
                        12,
                        24L
                },
                dataParams
        );


        // Verify PageResult metadata.
        assertSame(returnedContent, result.getContent());

        assertEquals(
                2,
                result.getPage()
        );

        assertEquals(
                12,
                result.getSize()
        );

        assertEquals(
                27L,
                result.getTotalElements()
        );

        // ceil(27 / 12) = 3
        assertEquals(
                3,
                result.getTotalPages()
        );
    }


    /*
     * This proves:
     * - admins do not receive the normal-user ownership restriction
     * - default sorting falls back to name ASC
     * - page 0 produces offset 0
     */
    @Test
    void search_admin_doesNotApplyOwnershipRestriction() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(5L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Part> result = partDao.search(
                null,
                null,
                null,
                null,
                null,
                null,
                0,
                12,
                "adminUser",
                true
        );


        ArgumentCaptor<String> countSqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> countParamsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).queryForObject(
                countSqlCaptor.capture(),
                eq(Long.class),
                countParamsCaptor.capture()
        );

        String countSql = countSqlCaptor.getValue();


        // Admin query should not contain ownership restriction.
        assertFalse(
                countSql.contains(
                        "username = ?"
                )
        );

        assertFalse(
                countSql.contains(
                        "is_public = TRUE OR"
                )
        );


        // With no filters, COUNT has no parameters.
        assertEquals(
                0,
                countParamsCaptor.getValue().length
        );


        ArgumentCaptor<String> dataSqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> dataParamsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).query(
                dataSqlCaptor.capture(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                dataParamsCaptor.capture()
        );


        // Null/invalid sort falls back to name ASC.
        assertTrue(
                dataSqlCaptor
                        .getValue()
                        .contains("ORDER BY name ASC")
        );


        // page=0, size=12 -> LIMIT 12 OFFSET 0
        assertArrayEquals(
                new Object[]{
                        12,
                        0L
                },
                dataParamsCaptor.getValue()
        );


        assertEquals(0, result.getPage());
        assertEquals(12, result.getSize());
        assertEquals(5L, result.getTotalElements());
        assertEquals(1, result.getTotalPages());
    }


    /*
     * Tests an exact page-size multiple.
     *
     * 24 records / 12 per page = exactly 2 pages.
     */
    @Test
    void search_exactMultiple_calculatesTotalPagesCorrectly() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(24L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Part> result = partDao.search(
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


        assertEquals(
                24L,
                result.getTotalElements()
        );

        assertEquals(
                2,
                result.getTotalPages()
        );
    }


    /*
     * Tests empty results.
     */
    @Test
    void search_noMatchingParts_returnsEmptyPaginationMetadata() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(0L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Part> result = partDao.search(
                "does-not-exist",
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


        assertNotNull(result);

        assertTrue(
                result.getContent().isEmpty()
        );

        assertEquals(
                0L,
                result.getTotalElements()
        );

        assertEquals(
                0,
                result.getTotalPages()
        );

        assertEquals(
                0,
                result.getPage()
        );

        assertEquals(
                12,
                result.getSize()
        );
    }


    /*
     * Proves that descending sorting is preserved
     * when the requested sort column is whitelisted.
     */
    @Test
    void search_allowedDescendingSort_isUsed() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(1L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        partDao.search(
                null,
                null,
                null,
                null,
                "created_at",
                "DESC",
                0,
                12,
                "adminUser",
                true
        );


        ArgumentCaptor<String> sqlCaptor =
                ArgumentCaptor.forClass(String.class);

        verify(jdbcTemplate).query(
                sqlCaptor.capture(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        );


        assertTrue(
                sqlCaptor
                        .getValue()
                        .contains(
                                "ORDER BY created_at DESC"
                        )
        );
    }


    /*
     * Proves that a non-whitelisted sort value cannot
     * be inserted directly into the SQL.
     */
    @Test
    void search_invalidSort_fallsBackToName() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(1L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        partDao.search(
                null,
                null,
                null,
                null,
                "DROP TABLE parts",
                "DESC",
                0,
                12,
                "adminUser",
                true
        );


        ArgumentCaptor<String> sqlCaptor =
                ArgumentCaptor.forClass(String.class);

        verify(jdbcTemplate).query(
                sqlCaptor.capture(),
                org.mockito.ArgumentMatchers.<RowMapper<Part>>any(),
                any(Object[].class)
        );


        String sql = sqlCaptor.getValue();

        assertTrue(
                sql.contains(
                        "ORDER BY name DESC"
                )
        );

        assertFalse(
                sql.contains(
                        "DROP TABLE"
                )
        );
    }
}

