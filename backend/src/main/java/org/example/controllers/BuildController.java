package org.example.controllers;

import java.util.List;

import org.example.models.Build;
import org.example.models.PageResult;
import org.example.models.Part;
import org.example.services.BuildService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/builds")
public class BuildController {

    private final BuildService buildService;

    public BuildController(BuildService buildService) {
        this.buildService = buildService;
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
    }

    // GET /api/builds?search=&visibility=&owner=&partCategory=&partSearch=&hasParts=&sortBy=&direction=&page=&size=
    @GetMapping
    public PageResult<Build> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String owner,
            @RequestParam(required = false) String partCategory,
            @RequestParam(required = false) String partSearch,
            @RequestParam(required = false) Boolean hasParts,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication auth) {

        /*
         * Preserve the original service call for requests that do not use
         * the new filters. The overload delegates to the expanded search in
         * production and keeps existing callers/tests source-compatible.
         */
        if (owner == null
                && partCategory == null
                && partSearch == null
                && hasParts == null) {

            return buildService.search(
                    search,
                    visibility,
                    sortBy,
                    direction,
                    page,
                    size,
                    auth.getName(),
                    isAdmin(auth));
        }

        return buildService.search(
                search,
                visibility,
                owner,
                partCategory,
                partSearch,
                hasParts,
                sortBy,
                direction,
                page,
                size,
                auth.getName(),
                isAdmin(auth));
    }

    // GET /api/builds/mine
    @GetMapping("/mine")
    public List<Build> findMine(Authentication auth) {
        return buildService.findMine(auth.getName());
    }

    // GET /api/builds/{id}
    @GetMapping("/{id}")
    public Build findById(@PathVariable int id, Authentication auth) {
        return buildService.findById(id, auth.getName(), isAdmin(auth));
    }

    // POST /api/builds
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Build create(@RequestBody Build build, Authentication auth) {
        return buildService.create(build, auth.getName());
    }

    // PUT /api/builds/{id}
    @PutMapping("/{id}")
    public Build update(@PathVariable int id, @RequestBody Build build, Authentication auth) {
        return buildService.update(id, build, auth.getName(), isAdmin(auth));
    }

    // DELETE /api/builds/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id, Authentication auth) {
        buildService.delete(id, auth.getName(), isAdmin(auth));
    }

    // join-table endpoints

    // POST /api/builds/{buildId}/parts/{partId}?quantity=1
    @PostMapping("/{buildId}/parts/{partId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void addPart(
            @PathVariable int buildId,
            @PathVariable int partId,
            @RequestParam(defaultValue = "1") int quantity,
            Authentication auth) {

        buildService.addPartToBuild(buildId, partId, quantity, auth.getName(), isAdmin(auth));
    }

    // DELETE /api/builds/{buildId}/parts/{partId}
    @DeleteMapping("/{buildId}/parts/{partId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePart(
            @PathVariable int buildId,
            @PathVariable int partId,
            Authentication auth) {

        buildService.removePartFromBuild(buildId, partId, auth.getName(), isAdmin(auth));
    }

    // GET /api/builds/{id}/parts
    @GetMapping("/{id}/parts")
    public List<Part> getPartsInBuild(@PathVariable int id, Authentication auth) {
        return buildService.getPartsInBuild(id, auth.getName(), isAdmin(auth));
    }
}
