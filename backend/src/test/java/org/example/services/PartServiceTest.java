package org.example.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;

import org.example.daos.PartDao;
import org.example.models.PageResult;
import org.example.models.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class PartServiceTest {

    private PartDao partDao;
    private PartService partService;

    @BeforeEach
    void setUp() {
        partDao = mock(PartDao.class);
        partService = new PartService(partDao);
    }

    private Part part(String name, String username, boolean isPublic) {
        Part part = new Part();
        part.setName(name);
        part.setCategory("GPU");
        part.setBrand("NVIDIA");
        part.setModel("RTX 5070");
        part.setPrice(new BigDecimal("599.99"));
        part.setDescription("Test part");
        part.setUsername(username);
        part.setIs_Public(isPublic);
        return part;
    }

    private ResponseStatusException assertStatus(HttpStatus status, Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(status, exception.getStatusCode());
        return exception;
    }

    @Test
    void create_validPart_forcesAuthenticatedOwnerAndPersists() {
        Part part = part("RTX 5070", "spoofed", true);

        Part result = partService.create(part, "alice");

        assertSame(part, result);
        assertEquals("alice", result.getUsername());
        verify(partDao).create(part);
    }

    @Test
    void create_nullPart_throwsBadRequest() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(null, "alice"));
        verifyNoInteractions(partDao);
    }

    @Test
    void create_blankName_throwsBadRequest() {
        Part part = part("   ", "alice", true);

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
        verifyNoInteractions(partDao);
    }

    @Test
    void create_nameTooLong_throwsBadRequest() {
        Part part = part("x".repeat(256), "alice", true);

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
    }

    @Test
    void create_blankCategory_throwsBadRequest() {
        Part part = part("GPU", "alice", true);
        part.setCategory(" ");

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
    }

    @Test
    void create_categoryTooLong_throwsBadRequest() {
        Part part = part("GPU", "alice", true);
        part.setCategory("x".repeat(101));

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
    }

    @Test
    void create_brandTooLong_throwsBadRequest() {
        Part part = part("GPU", "alice", true);
        part.setBrand("x".repeat(101));

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
    }

    @Test
    void create_modelTooLong_throwsBadRequest() {
        Part part = part("GPU", "alice", true);
        part.setModel("x".repeat(151));

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
    }

    @Test
    void create_negativePrice_throwsBadRequest() {
        Part part = part("GPU", "alice", true);
        part.setPrice(new BigDecimal("-0.01"));

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
    }

    @Test
    void create_priceAboveDatabaseMaximum_throwsBadRequest() {
        Part part = part("GPU", "alice", true);
        part.setPrice(new BigDecimal("100000000.00"));

        assertStatus(HttpStatus.BAD_REQUEST, () -> partService.create(part, "alice"));
    }

    @Test
    void create_nullOptionalFields_isAllowed() {
        Part part = part("GPU", "alice", true);
        part.setBrand(null);
        part.setModel(null);
        part.setPrice(null);

        assertSame(part, partService.create(part, "alice"));
        verify(partDao).create(part);
    }

    @Test
    void findById_missingPart_throwsNotFound() {
        when(partDao.findById(1)).thenReturn(null);

        assertStatus(HttpStatus.NOT_FOUND, () -> partService.findById(1, "alice", false));
    }

    @Test
    void findById_publicPart_allowsOtherUser() {
        Part part = part("GPU", "bob", true);
        when(partDao.findById(1)).thenReturn(part);

        assertSame(part, partService.findById(1, "alice", false));
    }

    @Test
    void findById_privatePart_allowsOwner() {
        Part part = part("GPU", "alice", false);
        when(partDao.findById(1)).thenReturn(part);

        assertSame(part, partService.findById(1, "alice", false));
    }

    @Test
    void findById_privatePart_allowsAdmin() {
        Part part = part("GPU", "bob", false);
        when(partDao.findById(1)).thenReturn(part);

        assertSame(part, partService.findById(1, "admin", true));
    }

    @Test
    void findById_privatePart_blocksOtherUser() {
        when(partDao.findById(1)).thenReturn(part("GPU", "bob", false));

        assertStatus(HttpStatus.FORBIDDEN, () -> partService.findById(1, "alice", false));
    }

    @Test
    void findMine_delegatesToDao() {
        List<Part> expected = List.of(part("GPU", "alice", false));
        when(partDao.findByUsername("alice")).thenReturn(expected);

        assertSame(expected, partService.findMine("alice"));
        verify(partDao).findByUsername("alice");
    }

    @Test
    void search_validPagination_delegatesToDao() {
        PageResult<Part> expected = new PageResult<>(List.of(new Part()), 2, 12, 27L, 3);
        BigDecimal maxPrice = new BigDecimal("800.00");
        when(partDao.search(
                "RTX", "GPU", "NVIDIA", maxPrice, "price", "ASC", 2, 12, "alice", false))
                .thenReturn(expected);

        PageResult<Part> actual = partService.search(
                "RTX", "GPU", "NVIDIA", maxPrice, "price", "ASC", 2, 12, "alice", false);

        assertSame(expected, actual);
        verify(partDao).search(
                "RTX", "GPU", "NVIDIA", maxPrice, "price", "ASC", 2, 12, "alice", false);
    }

    @Test
    void search_negativePage_throwsBadRequest() {
        assertStatus(HttpStatus.BAD_REQUEST,
                () -> partService.search(null, null, null, null, "name", "ASC", -1, 12, "alice", false));
        verifyNoInteractions(partDao);
    }

    @Test
    void search_invalidSizes_throwBadRequest() {
        assertStatus(HttpStatus.BAD_REQUEST,
                () -> partService.search(null, null, null, null, "name", "ASC", 0, 0, "alice", false));
        assertStatus(HttpStatus.BAD_REQUEST,
                () -> partService.search(null, null, null, null, "name", "ASC", 0, 51, "alice", false));
        verifyNoInteractions(partDao);
    }

    @Test
    void search_boundarySizes_areAllowed() {
        PageResult<Part> min = new PageResult<>(List.of(), 0, 1, 0L, 0);
        PageResult<Part> max = new PageResult<>(List.of(), 0, 50, 0L, 0);
        when(partDao.search(null, null, null, null, "name", "ASC", 0, 1, "alice", false)).thenReturn(min);
        when(partDao.search(null, null, null, null, "name", "ASC", 0, 50, "alice", false)).thenReturn(max);

        assertSame(min, partService.search(null, null, null, null, "name", "ASC", 0, 1, "alice", false));
        assertSame(max, partService.search(null, null, null, null, "name", "ASC", 0, 50, "alice", false));
    }

    @Test
    void update_missingPart_throwsNotFound() {
        when(partDao.findById(1)).thenReturn(null);

        assertStatus(HttpStatus.NOT_FOUND,
                () -> partService.update(1, part("New", "alice", true), "alice", false));
        verify(partDao, never()).update(any());
    }

    @Test
    void update_nonOwner_throwsForbiddenBeforeValidation() {
        when(partDao.findById(1)).thenReturn(part("Old", "bob", true));

        assertStatus(HttpStatus.FORBIDDEN,
                () -> partService.update(1, part("New", "alice", true), "alice", false));
        verify(partDao, never()).update(any());
    }

    @Test
    void update_owner_updatesEditableFieldsAndPreservesUsername() {
        Part existing = part("Old", "alice", false);
        Part updated = part("New", "ignored", true);
        updated.setCategory("CPU");
        updated.setBrand("AMD");
        updated.setModel("Ryzen 7");
        updated.setPrice(new BigDecimal("399.99"));
        updated.setDescription("Updated");
        when(partDao.findById(1)).thenReturn(existing);

        Part result = partService.update(1, updated, "alice", false);

        assertSame(existing, result);
        assertEquals("New", result.getName());
        assertEquals("CPU", result.getCategory());
        assertEquals("AMD", result.getBrand());
        assertEquals("Ryzen 7", result.getModel());
        assertEquals(new BigDecimal("399.99"), result.getPrice());
        assertEquals("Updated", result.getDescription());
        assertTrue(result.getIs_Public());
        assertEquals("alice", result.getUsername());
        verify(partDao).update(existing);
    }

    @Test
    void update_admin_canEditOtherUsersPart() {
        Part existing = part("Old", "bob", false);
        Part updated = part("Admin Edit", "ignored", true);
        when(partDao.findById(1)).thenReturn(existing);

        Part result = partService.update(1, updated, "admin", true);

        assertEquals("Admin Edit", result.getName());
        assertEquals("bob", result.getUsername());
        verify(partDao).update(existing);
    }

    @Test
    void update_invalidPart_throwsBadRequestForAuthorizedOwner() {
        Part existing = part("Old", "alice", false);
        Part updated = part("", "alice", true);
        when(partDao.findById(1)).thenReturn(existing);

        assertStatus(HttpStatus.BAD_REQUEST,
                () -> partService.update(1, updated, "alice", false));
        verify(partDao, never()).update(any());
    }

    @Test
    void delete_missingPart_throwsNotFound() {
        when(partDao.findById(1)).thenReturn(null);

        assertStatus(HttpStatus.NOT_FOUND, () -> partService.delete(1, "alice", false));
        verify(partDao, never()).delete(anyInt());
    }

    @Test
    void delete_nonOwner_throwsForbidden() {
        when(partDao.findById(1)).thenReturn(part("GPU", "bob", true));

        assertStatus(HttpStatus.FORBIDDEN, () -> partService.delete(1, "alice", false));
        verify(partDao, never()).delete(anyInt());
    }

    @Test
    void delete_owner_deletesPart() {
        when(partDao.findById(1)).thenReturn(part("GPU", "alice", false));

        partService.delete(1, "alice", false);

        verify(partDao).delete(1);
    }

    @Test
    void delete_admin_deletesOtherUsersPart() {
        when(partDao.findById(1)).thenReturn(part("GPU", "bob", false));

        partService.delete(1, "admin", true);

        verify(partDao).delete(1);
    }
}
