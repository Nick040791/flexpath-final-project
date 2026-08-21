package org.example.daos;   // change to your package
import org.example.models.Build;
import org.example.models.Part;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.example.models.PageResult;
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
    public PageResult<Build> search(
        String search,
        String visibility,
        String sortBy,
        String direction,
        int page,
        int size,
        String currentUsername,
        boolean isAdmin) {
        StringBuilder where = new StringBuilder(" FROM builds WHERE 1=1");
        List<Object> params = new ArrayList<>();





        //Auth First
        if (!isAdmin) {
            where.append(" AND (is_public = TRUE OR username = ?)");
            params.add(currentUsername);
        }
        if (search != null && !search.isBlank()) {
            where.append(" AND (name LIKE ? OR description LIKE ?)");
            String like = "%" + search + "%";
            params.add(like);
            params.add(like);
        }
        if (visibility != null && !visibility.isBlank()) {
            if ("public".equalsIgnoreCase(visibility)) {
                where.append(" AND is_public = TRUE");
            }
            else if ("private".equalsIgnoreCase(visibility)) {
                where.append(" AND is_public = FALSE");
            }
        }
        //Count authorized + filtered results
        String countSql = "SELECT COUNT(*)" + where;
        Long count = jdbcTemplate.queryForObject(
            countSql, 
            Long.class,
            params.toArray()
        );
        long totalElements = count == null ? 0L : count;
        Set<String> allowedSort = Set.of("name", "created_at");
        String safeSort = sortBy != null && allowedSort.contains(sortBy)
        ? sortBy
        : "name";

        
        String safeDir = "DESC".equalsIgnoreCase(direction) ? "DESC" : "ASC";
        long offset = (long) page * size;

        String dataSql =
            "SELECT *"
                + where
                + " ORDER BY "
                + safeSort
                + " "
                + safeDir
                + " LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(size);
        dataParams.add(offset);

        List<Build> content = jdbcTemplate.query(
            dataSql,
            buildMapper,
            dataParams.toArray()
        );

        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResult<>(
            content,
            page,
            size,
            totalElements,
            totalPages
        );
    }
}
