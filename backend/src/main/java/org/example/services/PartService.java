package org.example.services;

import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.daos.PartDao;
import org.example.models.Part;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PartService {

    private final PartDao partDao;

    public PartService(PartDao partDao) {
        this.partDao = partDao;
    }

    public Part create(@NonNull Part part, String currentUsername) {

        validatePart(part);

        // ownership is forced here
        part.setUsername(currentUsername);

        partDao.create(part);

        return part;
    }

    public Part findById(int id, String currentUsername, boolean isAdmin) {

        Part part = partDao.findById(id);

        if (part == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Part not found"
            );
        }

        // private parts only visible to owner or admin
        if (!part.getIs_Public()
                && !isAdmin
                && !part.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied"
            );
        }

        return part;
    }

    public List<Part> findMine(String currentUsername) {
        return partDao.findByUsername(currentUsername);
    }

    public List<Part> search(
            String search,
            String category,
            String brand,
            BigDecimal maxPrice,
            String sortBy,
            String direction,
            String currentUsername,
            boolean isAdmin) {

        List<Part> results = partDao.search(
                search,
                category,
                brand,
                maxPrice,
                sortBy,
                direction
        );

        if (isAdmin) {
            return results;
        }

        // non-admins only see public parts + their own private ones
        return results.stream()
                .filter(p ->
                        p.getIs_Public()
                                || p.getUsername().equals(currentUsername)
                )
                .toList();
    }

    public Part update(
            int id,
            Part updated,
            String currentUsername,
            boolean isAdmin) {

        Part existing = partDao.findById(id);

        if (existing == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Part not found"
            );
        }

        // ownership check
        if (!isAdmin
                && !existing.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only edit your own parts"
            );
        }

        // validate only after confirming the user is allowed to update
        validatePart(updated);

        existing.setName(updated.getName());
        existing.setCategory(updated.getCategory());
        existing.setBrand(updated.getBrand());
        existing.setModel(updated.getModel());
        existing.setPrice(updated.getPrice());
        existing.setDescription(updated.getDescription());
        existing.setIs_Public(updated.getIs_Public());

        // username stays the same
        partDao.update(existing);

        return existing;
    }

    public void delete(
            int id,
            String currentUsername,
            boolean isAdmin) {

        Part existing = partDao.findById(id);

        if (existing == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Part not found"
            );
        }

        if (!isAdmin
                && !existing.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete your own parts"
            );
        }

        partDao.delete(id);
    }

    private void validatePart(Part part) {

        if (part == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part is required"
            );
        }

        if (part.getName() == null
                || part.getName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part name is required"
            );
        }

        if (part.getName().length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part name cannot exceed 255 characters"
            );
        }

        if (part.getCategory() == null
                || part.getCategory().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part category is required"
            );
        }

        if (part.getCategory().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part category cannot exceed 100 characters"
            );
        }

        if (part.getBrand() != null
                && part.getBrand().length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part brand cannot exceed 100 characters"
            );
        }

        if (part.getModel() != null
                && part.getModel().length() > 150) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part model cannot exceed 150 characters"
            );
        }

        if (part.getPrice() != null
                && part.getPrice().compareTo(BigDecimal.ZERO) < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part price cannot be negative"
            );
        }

        // MySQL column is DECIMAL(10,2)
        if (part.getPrice() != null
                && part.getPrice().compareTo(
                new BigDecimal("99999999.99")
        ) > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part price is too large"
            );
        }
    }
}