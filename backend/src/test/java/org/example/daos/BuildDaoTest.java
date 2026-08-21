package org.example.daos;

import org.example.models.Build;
import org.example.models.PageResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;

import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BuildDaoTest {

    private JdbcTemplate jdbcTemplate;
    private BuildDao buildDao;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        buildDao = new BuildDao(jdbcTemplate);
    }


    /*
     * Normal user + visibility=All
     *
     * Proves:
     * - authorization restriction is included
     * - search applies to COUNT and SELECT
     * - page=2,size=12 -> OFFSET 24
     * - requested sorting is preserved
     * - pagination metadata is correct
     *
     * Plan security scenario:
     * 8 public
     * 10 other-user private
     * 4 Alice private
     *
     * Alice should see/count 12, not 22.
     */
    @Test
    void search_normalUserAll_appliesAuthorizationSearchAndPagination() {

        List<Build> returnedContent = List.of(
                new Build()
        );

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(12L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(returnedContent);


        PageResult<Build> result = buildDao.search(
                "gaming",
                "All",
                "created_at",
                "DESC",
                2,
                12,
                "alice",
                false
        );


        // ---------- Capture COUNT ----------

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


        // Normal-user security must be present.
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

        // "All" should not add a private-only restriction.
        assertFalse(
                countSql.contains(
                        "AND is_public = FALSE"
                )
        );


        assertArrayEquals(
                new Object[]{
                        "alice",
                        "%gaming%",
                        "%gaming%"
                },
                countParams
        );


        // ---------- Capture SELECT ----------

        ArgumentCaptor<String> dataSqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> dataParamsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).query(
                dataSqlCaptor.capture(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                dataParamsCaptor.capture()
        );

        String dataSql = dataSqlCaptor.getValue();
        Object[] dataParams = dataParamsCaptor.getValue();


        /*
         * COUNT and SELECT should start from the
         * same authorized + filtered result set.
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


        assertTrue(
                dataSql.contains(
                        "ORDER BY created_at DESC"
                )
        );

        assertTrue(
                dataSql.contains(
                        "LIMIT ? OFFSET ?"
                )
        );


        // page 2 * size 12 = offset 24.
        assertArrayEquals(
                new Object[]{
                        "alice",
                        "%gaming%",
                        "%gaming%",
                        12,
                        24L
                },
                dataParams
        );


        assertSame(
                returnedContent,
                result.getContent()
        );

        assertEquals(
                2,
                result.getPage()
        );

        assertEquals(
                12,
                result.getSize()
        );

        // Alice's authorized count, not all 22.
        assertEquals(
                12L,
                result.getTotalElements()
        );

        assertEquals(
                1,
                result.getTotalPages()
        );
    }


    /*
     * Normal user + Public
     *
     * Security still exists, but the requested
     * visibility narrows results to public Builds only.
     */
    @Test
    void search_normalUserPublic_returnsPublicOnly() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(8L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Build> result = buildDao.search(
                null,
                "Public",
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        );


        ArgumentCaptor<String> sqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> paramsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).queryForObject(
                sqlCaptor.capture(),
                eq(Long.class),
                paramsCaptor.capture()
        );

        String sql = sqlCaptor.getValue();


        assertTrue(
                sql.contains(
                        "(is_public = TRUE OR username = ?)"
                )
        );

        assertTrue(
                sql.contains(
                        "AND is_public = TRUE"
                )
        );

        assertArrayEquals(
                new Object[]{
                        "alice"
                },
                paramsCaptor.getValue()
        );


        assertEquals(
                8L,
                result.getTotalElements()
        );

        assertEquals(
                1,
                result.getTotalPages()
        );
    }


    /*
     * Normal user + Private
     *
     * Combination:
     *
     * (is_public = TRUE OR username = ?)
     * AND is_public = FALSE
     *
     * reduces to the current user's private Builds only.
     */
    @Test
    void search_normalUserPrivate_returnsOwnPrivateOnly() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(4L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Build> result = buildDao.search(
                null,
                "Private",
                "name",
                "ASC",
                0,
                12,
                "alice",
                false
        );


        ArgumentCaptor<String> sqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> paramsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).queryForObject(
                sqlCaptor.capture(),
                eq(Long.class),
                paramsCaptor.capture()
        );

        String sql = sqlCaptor.getValue();


        assertTrue(
                sql.contains(
                        "(is_public = TRUE OR username = ?)"
                )
        );

        assertTrue(
                sql.contains(
                        "AND is_public = FALSE"
                )
        );

        assertArrayEquals(
                new Object[]{
                        "alice"
                },
                paramsCaptor.getValue()
        );


        assertEquals(
                4L,
                result.getTotalElements()
        );

        assertEquals(
                1,
                result.getTotalPages()
        );
    }


    /*
     * Admin + All
     *
     * Admin should not receive the normal-user
     * ownership/public restriction.
     */
    @Test
    void search_adminAll_hasNoOwnershipRestriction() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(22L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Build> result = buildDao.search(
                null,
                "All",
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


        assertFalse(
                countSql.contains(
                        "username = ?"
                )
        );

        assertFalse(
                countSql.contains(
                        "AND is_public = FALSE"
                )
        );

        assertEquals(
                0,
                countParamsCaptor.getValue().length
        );


        // Default sort should become name ASC.
        ArgumentCaptor<String> dataSqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> dataParamsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).query(
                dataSqlCaptor.capture(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                dataParamsCaptor.capture()
        );


        assertTrue(
                dataSqlCaptor
                        .getValue()
                        .contains("ORDER BY name ASC")
        );


        // page 0 -> offset 0
        assertArrayEquals(
                new Object[]{
                        12,
                        0L
                },
                dataParamsCaptor.getValue()
        );


        assertEquals(
                22L,
                result.getTotalElements()
        );

        // ceil(22 / 12) = 2
        assertEquals(
                2,
                result.getTotalPages()
        );
    }


    /*
     * Admin + Public
     *
     * Admin gets all public Builds without
     * an ownership condition.
     */
    @Test
    void search_adminPublic_returnsAllPublicBuilds() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(8L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        buildDao.search(
                null,
                "Public",
                "name",
                "ASC",
                0,
                12,
                "adminUser",
                true
        );


        ArgumentCaptor<String> sqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> paramsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).queryForObject(
                sqlCaptor.capture(),
                eq(Long.class),
                paramsCaptor.capture()
        );

        String sql = sqlCaptor.getValue();


        assertTrue(
                sql.contains(
                        "AND is_public = TRUE"
                )
        );

        assertFalse(
                sql.contains(
                        "username = ?"
                )
        );

        assertEquals(
                0,
                paramsCaptor.getValue().length
        );
    }


    /*
     * Admin + Private
     *
     * Admin should see all private Builds,
     * not only Builds owned by the admin.
     */
    @Test
    void search_adminPrivate_returnsAllPrivateBuilds() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(14L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Build> result = buildDao.search(
                null,
                "Private",
                "name",
                "ASC",
                0,
                12,
                "adminUser",
                true
        );


        ArgumentCaptor<String> sqlCaptor =
                ArgumentCaptor.forClass(String.class);

        ArgumentCaptor<Object[]> paramsCaptor =
                ArgumentCaptor.forClass(Object[].class);

        verify(jdbcTemplate).queryForObject(
                sqlCaptor.capture(),
                eq(Long.class),
                paramsCaptor.capture()
        );

        String sql = sqlCaptor.getValue();


        assertTrue(
                sql.contains(
                        "AND is_public = FALSE"
                )
        );

        assertFalse(
                sql.contains(
                        "username = ?"
                )
        );

        assertEquals(
                0,
                paramsCaptor.getValue().length
        );


        assertEquals(
                14L,
                result.getTotalElements()
        );

        // ceil(14 / 12) = 2
        assertEquals(
                2,
                result.getTotalPages()
        );
    }


    /*
     * Empty result set should still return
     * stable pagination metadata.
     */
    @Test
    void search_noMatches_returnsEmptyPageResult() {

        when(jdbcTemplate.queryForObject(
                anyString(),
                eq(Long.class),
                any(Object[].class)
        )).thenReturn(0L);

        when(jdbcTemplate.query(
                anyString(),
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Build> result = buildDao.search(
                "does-not-exist",
                "Public",
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
     * Exact page multiple:
     *
     * 24 / 12 = exactly 2 pages.
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
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        PageResult<Build> result = buildDao.search(
                null,
                "All",
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
     * Whitelisted DESC sorting should be preserved.
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
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        buildDao.search(
                null,
                "All",
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
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
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
     * Non-whitelisted sort values must fall
     * back to the safe default "name".
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
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
                any(Object[].class)
        )).thenReturn(List.of());


        buildDao.search(
                null,
                "All",
                "DROP TABLE builds",
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
                org.mockito.ArgumentMatchers.<RowMapper<Build>>any(),
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