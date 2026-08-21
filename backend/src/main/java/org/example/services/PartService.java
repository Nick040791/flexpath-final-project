package org.example.services;

import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.daos.PartDao;
import org.example.models.Part;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.example.models.PageResult;
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

        validatePagination(page, size);

        return partDao.search(
                search,
                category,
                brand,
                maxPrice,
                sortBy,
                direction,
                page,
                size,
                currentUsername,
                isAdmin
            );
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
        private void validatePagination(int page, int size){
        if (page < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Page Cannot be negative");
        }
        if (size < 1 || size > 50){
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Size must be between 1 and 50");
        }
    }
}