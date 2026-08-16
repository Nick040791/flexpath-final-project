package org.example.daos;   // change to your package

import org.example.models.Build;
import org.example.models.Part;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Repository
public class BuildDao {

    private final JdbcTemplate jdbcTemplate;

    public BuildDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Build> buildMapper = (rs, rowNum) -> {
        Build build = new Build();
        build.setId(rs.getInt("id"));
        build.setName(rs.getString("name"));
        build.setDescription(rs.getString("description"));
        build.setIs_Public(rs.getBoolean("is_public"));
        build.setUsername(rs.getString("username"));
        build.setCreated_at(rs.getTimestamp("created_at").toLocalDateTime());
        return build;
    };

    // Re-use a Part mapper if you already have one, or define a simple one here
    private final RowMapper<Part> partMapper = (rs, rowNum) -> {
        Part part = new Part();
        part.setId(rs.getInt("id"));
        part.setName(rs.getString("name"));
        part.setCategory(rs.getString("category"));
        part.setBrand(rs.getString("brand"));
        part.setModel(rs.getString("model"));
        part.setPrice(rs.getBigDecimal("price"));
        part.setDescription(rs.getString("description"));
        part.setIs_Public(rs.getBoolean("is_public"));
        part.setUsername(rs.getString("username"));
        return part;
    };

    public Build findById(int id) {
        String sql = "SELECT * FROM builds WHERE id = ?";
        List<Build> results = jdbcTemplate.query(sql, buildMapper, id);
        return results.isEmpty() ? null : results.get(0);
    }

    public List<Build> findAll() {
        return jdbcTemplate.query("SELECT * FROM builds", buildMapper);
    }

    public List<Build> findByUsername(String username) {
        String sql = "SELECT * FROM builds WHERE username = ?";
        return jdbcTemplate.query(sql, buildMapper, username);
    }

    public void create(Build build) {
        String sql = """
            INSERT INTO builds (name, description, is_public, username)
            VALUES (?, ?, ?, ?)
            """;
        jdbcTemplate.update(sql,
                build.getName(),
                build.getDescription(),
                build.getIs_Public(),
                build.getUsername());
    }

    public void update(Build build) {
        String sql = """
            UPDATE builds
            SET name = ?, description = ?, is_public = ?
            WHERE id = ?
            """;
        jdbcTemplate.update(sql,
                build.getName(),
                build.getDescription(),
                build.getIs_Public(),
                build.getId());
    }

    public void delete(int id) {
        jdbcTemplate.update("DELETE FROM builds WHERE id = ?", id);
    }

    // ----- join table methods -----

    public void addPartToBuild(int buildId, int partId, int quantity) {
        String sql = "INSERT INTO build_parts (build_id, part_id, quantity) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, buildId, partId, quantity);
    }

    public void removePartFromBuild(int buildId, int partId) {
        String sql = "DELETE FROM build_parts WHERE build_id = ? AND part_id = ?";
        jdbcTemplate.update(sql, buildId, partId);
    }

    public List<Part> findPartsByBuildId(int buildId) {
        String sql = """
            SELECT p.* FROM parts p
            JOIN build_parts bp ON p.id = bp.part_id
            WHERE bp.build_id = ?
            """;
        return jdbcTemplate.query(sql, partMapper, buildId);
    }

    /**
     * Search builds with LIKE + safe sorting
     */
    public List<Build> search(String search, String visibility, String sortBy, String direction) {
        StringBuilder sql = new StringBuilder("SELECT * FROM builds WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.isBlank()) {
            sql.append(" AND (name LIKE ? OR description LIKE ?)");
            String like = "%" + search + "%";
            params.add(like);
            params.add(like);
        }

        if (visibility != null && !visibility.isBlank()) {
            if ("public".equalsIgnoreCase(visibility)) {
                sql.append(" AND is_public = TRUE");
            }
            if ("private".equalsIgnoreCase(visibility)) {
                sql.append(" AND is_public = FALSE");
            }
        }

        Set<String> allowedSort = Set.of("name", "created_at");
        String safeSort = allowedSort.contains(sortBy) ? sortBy : "name";
        String safeDir = "DESC".equalsIgnoreCase(direction) ? "DESC" : "ASC";

        sql.append(" ORDER BY ").append(safeSort).append(" ").append(safeDir);

        return jdbcTemplate.query(sql.toString(), buildMapper, params.toArray());
    }
}
