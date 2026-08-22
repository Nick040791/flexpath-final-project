package org.example.daos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.example.models.Build;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.support.KeyHolder;

class BuildDaoMutationTest {

    private JdbcTemplate jdbcTemplate;
    private BuildDao buildDao;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        buildDao = new BuildDao(jdbcTemplate);
    }

    @Test
    void create_assignsGeneratedDatabaseIdToBuild() {
        when(jdbcTemplate.update(
                any(PreparedStatementCreator.class),
                any(KeyHolder.class)
        )).thenAnswer(invocation -> {
            KeyHolder keyHolder = invocation.getArgument(1);
            keyHolder.getKeyList().add(Map.of("GENERATED_KEY", 42));
            return 1;
        });

        Build build = new Build();
        build.setName("New Build");
        build.setDescription("Created from a part card");
        build.setIs_Public(true);
        build.setUsername("user");

        buildDao.create(build);

        assertEquals(42, build.getId());
    }

    @Test
    void addPartToBuild_incrementsQuantityWhenPartAlreadyExists() {
        buildDao.addPartToBuild(4, 7, 2);

        verify(jdbcTemplate).update(
                contains("ON DUPLICATE KEY UPDATE"),
                eq(4),
                eq(7),
                eq(2),
                eq(2)
        );
    }
}
