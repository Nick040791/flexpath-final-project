package org.example.services;

import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.daos.BuildDao;
import org.example.models.Build;
import org.example.models.Part;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BuildService {

    private final BuildDao buildDao;

    public BuildService(BuildDao buildDao) {
        this.buildDao = buildDao;
    }

    public Build create(@NonNull Build build, String currentUsername) {
        build.setUsername(currentUsername);
        buildDao.create(build);
        return build;
    }

    public Build findById(int id, String currentUsername, boolean isAdmin) {
        Build build = buildDao.findById(id);
        if (build == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Build not found");
        }

        if (!build.getIs_Public() && !isAdmin && !build.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return build;
    }

    public List<Build> findMine(String currentUsername) {
        return buildDao.findByUsername(currentUsername);
    }

    public List<Build> search(String search, String sortBy, String direction,
                              String currentUsername, boolean isAdmin) {

        List<Build> results = buildDao.search(search, sortBy, direction);

        if (isAdmin) {
            return results;
        }

        return results.stream()
                .filter(b -> b.getIs_Public() || b.getUsername().equals(currentUsername))
                .toList();
    }

    public Build update(int id, Build updated, String currentUsername, boolean isAdmin) {
        Build existing = buildDao.findById(id);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Build not found");
        }

        if (!isAdmin && !existing.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own builds");
        }

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setIs_Public(updated.getIs_Public());

        buildDao.update(existing);
        return existing;
    }

    public void delete(int id, String currentUsername, boolean isAdmin) {
        Build existing = buildDao.findById(id);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Build not found");
        }

        if (!isAdmin && !existing.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own builds");
        }

        buildDao.delete(id);
    }

    //join-table operations

    public void addPartToBuild(int buildId, int partId, int quantity,
                               String currentUsername, boolean isAdmin) {
        Build build = findById(buildId, currentUsername, isAdmin); // also enforces visibility

        if (!isAdmin && !build.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own builds");
        }

        buildDao.addPartToBuild(buildId, partId, quantity);
    }

    public void removePartFromBuild(int buildId, int partId,
                                    String currentUsername, boolean isAdmin) {
        Build build = findById(buildId, currentUsername, isAdmin);

        if (!isAdmin && !build.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own builds");
        }

        buildDao.removePartFromBuild(buildId, partId);
    }

    public List<Part> getPartsInBuild(int buildId, String currentUsername, boolean isAdmin) {
        findById(buildId, currentUsername, isAdmin); // enforce visibility first
        return buildDao.findPartsByBuildId(buildId);
    }
}
