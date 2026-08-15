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
        return buildService.getBuildsByUser(auth.getName());
    }

    // POST api/builds
    // PUT api/builds/{id}
    // DELETE api/builds/{id}

    // --join table endpoints--

    // POST api/builds/{buildId}/parts/{partId}?quantity=1
    // DELETE api/builds/{buildId}/parts/{partId}
    // GET api/builds/{Id}/parts
}