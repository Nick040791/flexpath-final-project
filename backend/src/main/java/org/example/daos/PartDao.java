package org.example.daos;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.models.PageResult;
import org.example.models.Part;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

//Part Data Access
@Repository
public class PartDao {
    private final JdbcTemplate jdbcTemplate;

    public PartDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Part> mapper = (rs, rowNum) -> {
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
        part.setCreated_at(rs.getTimestamp("created_at").toLocalDateTime());
        return part;
    };
    public Part findById(int id) {
        String sql = "SELECT * FROM parts WHERE id = ?";
        List<Part> results = jdbcTemplate.query(sql, mapper, id);
        return results.isEmpty() ? null : results.get(0);
    }

    public List<Part> findAll() {
        return jdbcTemplate.query("SELECT * FROM parts", mapper);
    }

    public List<Part> findByUsername(String username) {
        String sql = "SELECT * FROM parts WHERE username = ?";
        return jdbcTemplate.query(sql, mapper, username);
    }

    public void create(@NonNull Part part) {
        String sql = """
            INSERT INTO parts
            (name, category, brand, model, price, description, is_public, username)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.update(sql,
                part.getName(),
                part.getCategory(),
                part.getBrand(),
                part.getModel(),
                part.getPrice(),
                part.getDescription(),
                part.getIs_Public(),
                part.getUsername());
    };

    public void update(@NonNull Part part) {
        String sql = """
            UPDATE parts
            SET name = ?, category = ?, brand = ?, model = ?,
                price = ?, description = ?, is_public = ?
            WHERE id = ?
            """;
        jdbcTemplate.update(sql,
                part.getName(),
                part.getCategory(),
                part.getBrand(),
                part.getModel(),
                part.getPrice(),
                part.getDescription(),
                part.getIs_Public(),
                part.getId());
    }

    public void delete(int id) {
        jdbcTemplate.update("DELETE FROM parts WHERE id = ?", id);
    }

    /*
      Search with LIKE + optional filters + safe sorting.
     */

    public PageResult<Part> search(
        String search,
        String category,
        String brand,
        BigDecimal maxPrice,
        String sortBy,
        String direction,
        int page,
        int size,
        String currentUsername,
        boolean isAdmin) {

            //use where
            StringBuilder where = new StringBuilder(" FROM parts WHERE 1=1");
            List<Object> params = new ArrayList<>();

            if (!isAdmin) { /*Auth comes first*/
                where.append(" AND (is_public = TRUE OR username = ?)");
                params.add(currentUsername);
            }
            if (search != null && !search.isBlank()) {
                where.append(" AND (name LIKE ? OR description LIKE ?)");
                String like = "%" + search + "%";
                params.add(like);
                params.add(like);
            }
            if (category != null && !category.isBlank()) {
                where.append(" AND category = ?");
                params.add(category);
            }
            if (brand != null && !brand.isBlank()) {
                where.append(" AND brand = ?");
                params.add(brand);
            }
            if (maxPrice != null) {
                where.append(" AND price <= ?");
                params.add(maxPrice);
            }

            //Count the authorized & filtered result set
            String countSql = "SELECT COUNT(*)" + where;

            Long count = jdbcTemplate.queryForObject(
                countSql,
                Long.class,
                params.toArray()
            );

            long totalElements = count == null ? 0L : count;


            // Safe sort the whitelist
            Set<String> allowedSort = Set.of(
                "name",
                "price",
                "created_at",
                "category",
                "brand");

            String safeSort =
                sortBy != null && allowedSort.contains(sortBy)
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

        List<Part> content = jdbcTemplate.query(
            dataSql,
            mapper,
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



