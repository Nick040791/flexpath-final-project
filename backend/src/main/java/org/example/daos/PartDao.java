package org.example.daos;
import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.models.Part;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;


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

    public List<Part> search(String search, String category, String brand,
                             BigDecimal maxPrice, String sortBy, String direction) {

        StringBuilder sql = new StringBuilder("SELECT * FROM parts WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (search != null && !search.isBlank()) {
            sql.append(" AND (name LIKE ? OR description LIKE ?)");
            String like = "%" + search + "%";
            params.add(like);
            params.add(like);
        }
        if (category != null && !category.isBlank()) {
            sql.append(" AND category = ?");
            params.add(category);
        }
        if (brand != null && !brand.isBlank()) {
            sql.append(" AND brand = ?");
            params.add(brand);
        }
        if (maxPrice != null) {
            sql.append(" AND price <= ?");
            params.add(maxPrice);
        }

        // Safe sort the whitelist
        Set<String> allowedSort = Set.of("name", "price", "created_at", "category", "brand");String safeSort = allowedSort.contains(sortBy) ? sortBy : "name";
        String safeDir = "DESC".equalsIgnoreCase(direction) ? "DESC" : "ASC";

        sql.append(" ORDER BY ").append(safeSort).append(" ").append(safeDir);

        return jdbcTemplate.query(sql.toString(), mapper, params.toArray());
    }
}



