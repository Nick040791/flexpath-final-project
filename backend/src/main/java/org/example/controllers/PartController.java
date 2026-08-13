package org.example.controllers;   // change to your package

import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.models.Part;
import org.example.services.PartService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/parts")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    private boolean isAdmin(@NonNull Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    // GET /api/parts?search=&category=&brand=&maxPrice=&sortBy=&direction=
    @GetMapping
    public List<Part> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            Authentication auth) {

        String username = auth.getName();
        boolean admin = isAdmin(auth);
        return partService.search(search, category, brand, maxPrice, sortBy, direction, username, admin);
    }

    // GET /api/parts/mine
    @GetMapping("/mine")
    public List<Part> findMine(Authentication auth) {
        return partService.findMine(auth.getName());
    }

    // GET /api/parts/{id}
    @GetMapping("/{id}")
    public Part findById(@PathVariable int id, Authentication auth) {
        return partService.findById(id, auth.getName(), isAdmin(auth));
    }

    // POST /api/parts
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Part create(@RequestBody Part part, Authentication auth) {
        return partService.create(part, auth.getName());
    }

    // PUT /api/parts/{id}
    @PutMapping("/{id}")
    public Part update(@PathVariable int id, @RequestBody Part part, Authentication auth) {
        return partService.update(id, part, auth.getName(), isAdmin(auth));
    }

    // DELETE /api/parts/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id, Authentication auth) {
        partService.delete(id, auth.getName(), isAdmin(auth));
    }
}
