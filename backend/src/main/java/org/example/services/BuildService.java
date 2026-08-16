package org.example.services;

import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.daos.BuildDao;
import org.example.daos.PartDao;
import org.example.models.Build;
import org.example.models.Part;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BuildService {

    private final BuildDao buildDao;
    private final PartDao partDao;

    public BuildService(BuildDao buildDao, PartDao partDao) {
        this.buildDao = buildDao;
        this.partDao = partDao;
    }

    public Build create(@NonNull Build build, String currentUsername) {

        validateBuild(build);

        build.setUsername(currentUsername);

        buildDao.create(build);

        return build;
    }

    public Build findById(
            int id,
            String currentUsername,
            boolean isAdmin) {

        Build build = buildDao.findById(id);

        if (build == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Build not found"
            );
        }

        if (!build.getIs_Public()
                && !isAdmin
                && !build.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied"
            );
        }

        return build;
    }

    public List<Build> findMine(String currentUsername) {
        return buildDao.findByUsername(currentUsername);
    }

    public List<Build> search(
            String search,
            String visibility,
            String sortBy,
            String direction,
            String currentUsername,
            boolean isAdmin) {

        List<Build> results =
                buildDao.search(search, visibility, sortBy, direction);

        if (isAdmin) {
            return results;
        }

        return results.stream()
                .filter(b ->
                        b.getIs_Public()
                                || b.getUsername().equals(currentUsername)
                )
                .toList();
    }

    public Build update(
            int id,
            Build updated,
            String currentUsername,
            boolean isAdmin) {

        Build existing = buildDao.findById(id);

        if (existing == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Build not found"
            );
        }

        if (!isAdmin
                && !existing.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only edit your own builds"
            );
        }

        // validate only after confirming user can modify the build
        validateBuild(updated);

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setIs_Public(updated.getIs_Public());

        buildDao.update(existing);

        return existing;
    }

    public void delete(
            int id,
            String currentUsername,
            boolean isAdmin) {

        Build existing = buildDao.findById(id);

        if (existing == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Build not found"
            );
        }

        if (!isAdmin
                && !existing.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete your own builds"
            );
        }

        buildDao.delete(id);
    }

    // ---------------- Join-table operations ----------------

    public void addPartToBuild(
            int buildId,
            int partId,
            int quantity,
            String currentUsername,
            boolean isAdmin) {

        Build build =
                findById(buildId, currentUsername, isAdmin);

        if (!isAdmin
                && !build.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only modify your own builds"
            );
        }

        Part part = partDao.findById(partId);

        if (part == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Part not found"
            );
        }

        if (!part.getIs_Public()
                && !isAdmin
                && !part.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot add another user's private part"
            );
        }

        if (quantity <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity must be greater than zero"
            );
        }

        buildDao.addPartToBuild(
                buildId,
                partId,
                quantity
        );
    }

    public void removePartFromBuild(
            int buildId,
            int partId,
            String currentUsername,
            boolean isAdmin) {

        Build build =
                findById(buildId, currentUsername, isAdmin);

        if (!isAdmin
                && !build.getUsername().equals(currentUsername)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only modify your own builds"
            );
        }

        buildDao.removePartFromBuild(
                buildId,
                partId
        );
    }

    public List<Part> getPartsInBuild(
            int buildId,
            String currentUsername,
            boolean isAdmin) {

        findById(
                buildId,
                currentUsername,
                isAdmin
        );

        List<Part> parts =
                buildDao.findPartsByBuildId(buildId);

        // Admin can see all parts
        if (isAdmin) {
            return parts;
        }

        // Other users can only see public parts
        // or private parts that they own
        return parts.stream()
                .filter(part ->
                        part.getIs_Public()
                                || part.getUsername()
                                .equals(currentUsername)
                )
                .toList();
    }

    private void validateBuild(Build build) {

        if (build == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Build is required"
            );
        }

        if (build.getName() == null
                || build.getName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Build name is required"
            );
        }

        if (build.getName().length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Build name cannot exceed 255 characters"
            );
        }
    }
}