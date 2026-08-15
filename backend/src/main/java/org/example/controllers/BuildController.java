package org.example.controllers;

import org.example.models.Build;
import org.example.models.Part;
import org.example.services.BuildService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // map GET /api/builds?search=&sortBy=&direction=
    @GetMapping
    public List<Build> search (
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            Authentication auth) {

        return buildService.search(search, sortBy, direction, auth.getName(), isAdmin(auth));
    }
    // GET api/builds/mine
    @GetMapping("/mine")
    public List<Build> getMyBuilds(Authentication auth) {
        return buildService.findMine(auth.getName());
    }
    // GET api/builds/{id}
    @GetMapping("/{id}")
    public Build findById (@PathVariable int id, Authentication auth) {
        return buildService.findById(id, auth.getName(), isAdmin(auth));
    }
    // POST api/builds
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Build create(@RequestBody Build build, Authentication auth) {
        return buildService.create(build, auth.getName());
    }
    // PUT api/builds/{id}
    @PutMapping("/{id}")
    public Build updateBuild(@PathVariable int id, @RequestBody Build build, Authentication auth) {
        return buildService.update(id, build, auth.getName(), isAdmin(auth));
    }
    // DELETE api/builds/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id, Authentication auth) {
        buildService.delete(id, auth.getName(), isAdmin(auth));
    }

    // --join table endpoints--

    // POST api/builds/{buildId}/parts/{partId}?quantity=1
    @PostMapping("/{Id}/parts/{partId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void addPart(
        @PathVariable int buildId, 
        @PathVariable int partId,
        @RequestParam(defaultValue = "1") int quantity,
        Authentication auth) {
        buildService.addPartToBuild(buildId, partId, quantity, auth.getName(), isAdmin(auth));
    }
    // DELETE api/builds/{buildId}/parts/{partId}
    @DeleteMapping("/{Id}/parts/{partId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePart(
        @PathVariable int buildId, 
        @PathVariable int partId,
        Authentication auth) {

    buildService.removePartFromBuild(buildId, partId, auth.getName(), isAdmin(auth));
    }
    // GET api/builds/{Id}/parts
    @GetMapping("/{Id}/parts")
    public List<Part> getPartsInBuild(@PathVariable int buildId, Authentication auth) {
        return buildService.getPartsInBuild(buildId, auth.getName(), isAdmin(auth));
    }
}