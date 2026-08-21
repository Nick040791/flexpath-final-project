package org.example.controllers;   // change to your package
import java.math.BigDecimal;
import java.util.List;

import org.checkerframework.checker.nullness.qual.NonNull;
import org.example.models.PageResult;
import org.example.models.Part;
import org.example.services.PartService;
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
@RequestMapping("/api/parts")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    private boolean isAdmin(@NonNull Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
    }

    // GET /api/parts?search=&category=&brand=&maxPrice=&sortBy=&direction=&page=&size=
    @GetMapping
    public PageResult<Part> search(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String brand,
        @RequestParam(required = false) BigDecimal maxPrice,
        @RequestParam(defaultValue = "name") String sortBy,
        @RequestParam(defaultValue = "ASC") String direction,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        Authentication auth)
        {
        String username = auth.getName();
        boolean admin = isAdmin(auth);

        return partService.search(
            search,
            category,
            brand,
            maxPrice,
            sortBy,
            direction,
            page,
            size,
            username,
            admin
            );
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
