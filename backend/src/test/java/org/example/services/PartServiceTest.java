package org.example.services;

import org.example.daos.PartDao;
import org.example.models.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PartServiceTest {

    private PartDao dao;
    private PartService service;

    @BeforeEach
    void setUp() {
        dao = mock(PartDao.class);
        service = new PartService(dao);
    }

    @Test
    void findByIdReturnsNotFoundWhenDaoReturnsNull() {

        when(dao.findById(99))
                .thenReturn(null);

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.findById(
                                99,
                                "alice",
                                false
                        )
                );

        assertEquals(
                HttpStatus.NOT_FOUND,
                error.getStatusCode()
        );

        assertEquals(
                "Part not found",
                error.getReason()
        );
    }

    @Test
    void privatePartIsVisibleOnlyToOwnerOrAdmin() {

        Part privatePart =
                part(1, "owner", false);

        when(dao.findById(1))
                .thenReturn(privatePart);

        assertEquals(
                HttpStatus.FORBIDDEN,
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.findById(
                                1,
                                "other",
                                false
                        )
                ).getStatusCode()
        );

        assertSame(
                privatePart,
                service.findById(
                        1,
                        "owner",
                        false
                )
        );

        assertSame(
                privatePart,
                service.findById(
                        1,
                        "admin",
                        true
                )
        );
    }

    @Test
    void searchFiltersPrivatePartsForNonAdmins() {

        Part publicPart =
                part(1, "other", true);

        Part ownedPrivate =
                part(2, "alice", false);

        Part otherPrivate =
                part(3, "other", false);

        when(
                dao.search(
                        null,
                        null,
                        null,
                        null,
                        "name",
                        "ASC"
                )
        ).thenReturn(
                List.of(
                        publicPart,
                        ownedPrivate,
                        otherPrivate
                )
        );

        assertEquals(
                List.of(
                        publicPart,
                        ownedPrivate
                ),
                service.search(
                        null,
                        null,
                        null,
                        null,
                        "name",
                        "ASC",
                        "alice",
                        false
                )
        );

        assertEquals(
                3,
                service.search(
                        null,
                        null,
                        null,
                        null,
                        "name",
                        "ASC",
                        "admin",
                        true
                ).size()
        );
    }

    @Test
    void updateRejectsMissingAndNonOwnedPartWithoutWriting() {

        Part update =
                part(1, "alice", true);

        when(dao.findById(1))
                .thenReturn(null);

        assertEquals(
                HttpStatus.NOT_FOUND,
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.update(
                                1,
                                update,
                                "alice",
                                false
                        )
                ).getStatusCode()
        );

        when(dao.findById(1))
                .thenReturn(
                        part(
                                1,
                                "other",
                                false
                        )
                );

        assertEquals(
                HttpStatus.FORBIDDEN,
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.update(
                                1,
                                update,
                                "alice",
                                false
                        )
                ).getStatusCode()
        );

        verify(
                dao,
                never()
        ).update(
                any(Part.class)
        );
    }

    @Test
    void adminCanUpdateAndDeleteAnotherUsersPartWithoutChangingOwner() {

        Part existing =
                part(1, "owner", false);

        Part update =
                part(1, "ignored", true);

        update.setName("Updated");
        update.setCategory("GPU");
        update.setPrice(
                new BigDecimal("499.99")
        );

        when(dao.findById(1))
                .thenReturn(existing);

        Part result =
                service.update(
                        1,
                        update,
                        "admin",
                        true
                );

        service.delete(
                1,
                "admin",
                true
        );

        assertSame(
                existing,
                result
        );

        assertEquals(
                "owner",
                result.getUsername()
        );

        assertEquals(
                "Updated",
                result.getName()
        );

        verify(dao)
                .update(existing);

        verify(dao)
                .delete(1);
    }

    @Test
    void deleteRejectsMissingAndNonOwnedPartWithoutWriting() {

        when(dao.findById(1))
                .thenReturn(null);

        assertEquals(
                HttpStatus.NOT_FOUND,
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.delete(
                                1,
                                "alice",
                                false
                        )
                ).getStatusCode()
        );

        when(dao.findById(1))
                .thenReturn(
                        part(
                                1,
                                "other",
                                true
                        )
                );

        assertEquals(
                HttpStatus.FORBIDDEN,
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.delete(
                                1,
                                "alice",
                                false
                        )
                ).getStatusCode()
        );

        verify(
                dao,
                never()
        ).delete(anyInt());
    }

    // ---------------- Validation tests ----------------

    @Test
    void createValidPartForcesCurrentUserAsOwner() {

        Part part = new Part();
        part.setName("RTX 4070 Super");
        part.setCategory("GPU");
        part.setBrand("NVIDIA");
        part.setModel("4070 Super");
        part.setPrice(
                new BigDecimal("599.99")
        );
        part.setIs_Public(true);

        Part result =
                service.create(
                        part,
                        "alice"
                );

        assertSame(
                part,
                result
        );

        assertEquals(
                "alice",
                result.getUsername()
        );

        verify(dao)
                .create(part);
    }

    @Test
    void createRejectsBlankPartNameWithoutWriting() {

        Part part = new Part();
        part.setName("   ");
        part.setCategory("GPU");

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.create(
                                part,
                                "alice"
                        )
                );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        assertEquals(
                "Part name is required",
                error.getReason()
        );

        verify(
                dao,
                never()
        ).create(any(Part.class));
    }

    @Test
    void createRejectsMissingPartCategoryWithoutWriting() {

        Part part = new Part();
        part.setName("RTX 4070 Super");
        part.setCategory(null);

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.create(
                                part,
                                "alice"
                        )
                );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        assertEquals(
                "Part category is required",
                error.getReason()
        );

        verify(
                dao,
                never()
        ).create(any(Part.class));
    }

    @Test
    void createRejectsNegativePriceWithoutWriting() {

        Part part = new Part();
        part.setName("RTX 4070 Super");
        part.setCategory("GPU");
        part.setPrice(
                new BigDecimal("-1.00")
        );

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.create(
                                part,
                                "alice"
                        )
                );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        assertEquals(
                "Part price cannot be negative",
                error.getReason()
        );

        verify(
                dao,
                never()
        ).create(any(Part.class));
    }

    @Test
    void createRejectsPartNameOver255Characters() {

        Part part = new Part();
        part.setName(
                "A".repeat(256)
        );
        part.setCategory("GPU");

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.create(
                                part,
                                "alice"
                        )
                );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        assertEquals(
                "Part name cannot exceed 255 characters",
                error.getReason()
        );

        verify(
                dao,
                never()
        ).create(any(Part.class));
    }

    @Test
    void updateRejectsInvalidPartWithoutWriting() {

        Part existing =
                part(1, "alice", true);

        existing.setName("RTX 4070");
        existing.setCategory("GPU");

        Part updated =
                part(1, "alice", true);

        updated.setName("");
        updated.setCategory("GPU");

        when(dao.findById(1))
                .thenReturn(existing);

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.update(
                                1,
                                updated,
                                "alice",
                                false
                        )
                );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        assertEquals(
                "Part name is required",
                error.getReason()
        );

        verify(
                dao,
                never()
        ).update(any(Part.class));
    }

    private static Part part(
            int id,
            String username,
            boolean isPublic) {

        Part part = new Part();

        part.setId(id);
        part.setUsername(username);
        part.setIs_Public(isPublic);

        return part;
    }
}