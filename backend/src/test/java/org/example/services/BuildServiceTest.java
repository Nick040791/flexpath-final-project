package org.example.services;
import org.example.daos.BuildDao;
import org.example.daos.PartDao;
import org.example.models.Build;
import org.example.models.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BuildServiceTest {
    private BuildDao buildDao;
    private PartDao partDao;
    private BuildService service;

    @BeforeEach
    void setUp() {
        buildDao = mock(BuildDao.class);
        partDao = mock(PartDao.class);
        service = new BuildService(buildDao, partDao);
    }

    @Test
    void findByIdReturnsNotFoundWhenDaoReturnsNull() {
        when(buildDao.findById(99)).thenReturn(null);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.findById(99, "alice", false));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        assertEquals("Build not found", error.getReason());
    }

    @Test
    void privateBuildIsVisibleOnlyToOwnerOrAdmin() {
        Build privateBuild = build(1, "owner", false);
        when(buildDao.findById(1)).thenReturn(privateBuild);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.findById(1, "other", false));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        assertSame(privateBuild, service.findById(1, "owner", false));
        assertSame(privateBuild, service.findById(1, "admin", true));
    }

    @Test
    void searchFiltersPrivateBuildsForNonAdmins() {
        Build publicBuild = build(1, "other", true);
        Build ownedPrivate = build(2, "alice", false);
        Build otherPrivate = build(3, "other", false);
        when(buildDao.search(null, "name", "ASC"))
                .thenReturn(List.of(publicBuild, ownedPrivate, otherPrivate));

        assertEquals(List.of(publicBuild, ownedPrivate),
                service.search(null, "name", "ASC", "alice", false));
        assertEquals(3, service.search(null, "name", "ASC", "admin", true).size());
    }

    @Test
    void updateRejectsMissingAndNonOwnedBuildWithoutWriting() {
        Build update = build(1, "alice", true);
        when(buildDao.findById(1)).thenReturn(null);
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class,
                        () -> service.update(1, update, "alice", false)).getStatusCode());

        when(buildDao.findById(1)).thenReturn(build(1, "other", false));
        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> service.update(1, update, "alice", false)).getStatusCode());
        verify(buildDao, never()).update(any(Build.class));
    }

    @Test
    void adminCanUpdateAndDeleteAnotherUsersBuild() {
        Build existing = build(1, "owner", false);
        Build update = build(1, "ignored", true);
        update.setName("Updated");
        update.setDescription("New description");
        when(buildDao.findById(1)).thenReturn(existing);

        Build result = service.update(1, update, "admin", true);
        service.delete(1, "admin", true);

        assertSame(existing, result);
        assertEquals("owner", result.getUsername());
        assertEquals("Updated", result.getName());
        verify(buildDao).update(existing);
        verify(buildDao).delete(1);
    }

    @Test
    void canAddOwnPrivatePartToOwnBuild() {

        Build build = build(1, "alice", true);

        Part privatePart = new Part();
        privatePart.setId(2);
        privatePart.setUsername("alice");
        privatePart.setIs_Public(false);

        when(buildDao.findById(1)).thenReturn(build);
        when(partDao.findById(2)).thenReturn(privatePart);

        service.addPartToBuild(
                1,
                2,
                1,
                "alice",
                false
        );

        verify(buildDao).addPartToBuild(1, 2, 1);
    }

    @Test
    void nonOwnerCannotMutatePublicBuildParts() {
        when(buildDao.findById(1)).thenReturn(build(1, "owner", true));

        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> service.addPartToBuild(1, 2, 1, "other", false)).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> service.removePartFromBuild(1, 2, "other", false)).getStatusCode());
        verify(buildDao, never()).addPartToBuild(anyInt(), anyInt(), anyInt());
        verify(buildDao, never()).removePartFromBuild(anyInt(), anyInt());
    }

    @Test
    void adminCanMutatePartsAndVisibilityIsCheckedBeforeReadingParts() {
        when(buildDao.findById(1)).thenReturn(build(1, "owner", false));

        Part part = new Part();
        part.setId(2);

        when(partDao.findById(2)).thenReturn(part);
        when(buildDao.findPartsByBuildId(1)).thenReturn(List.of(part));

        service.addPartToBuild(1, 2, 3, "admin", true);
        service.removePartFromBuild(1, 2, "admin", true);
        assertEquals(
                List.of(part),
                service.getPartsInBuild(1, "admin", true)
        );

        verify(buildDao).addPartToBuild(1, 2, 3);
        verify(buildDao).removePartFromBuild(1, 2);
        verify(buildDao).findPartsByBuildId(1);
    }

    @Test
    void cannotAddAnotherUsersPrivatePartToOwnBuild() {

        Build build = build(1, "alice", true);

        Part privatePart = new Part();
        privatePart.setId(2);
        privatePart.setUsername("bob");
        privatePart.setIs_Public(false);

        when(buildDao.findById(1)).thenReturn(build);
        when(partDao.findById(2)).thenReturn(privatePart);

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.addPartToBuild(
                                1,
                                2,
                                1,
                                "alice",
                                false
                        )
                );

        assertEquals(
                HttpStatus.FORBIDDEN,
                error.getStatusCode()
        );

        verify(
                buildDao,
                never()
        ).addPartToBuild(
                anyInt(),
                anyInt(),
                anyInt()
        );
    }

    @Test
    void cannotAddPartWithInvalidQuantity() {

        Build build = build(1, "alice", true);

        Part part = new Part();
        part.setId(2);
        part.setUsername("alice");
        part.setIs_Public(true);

        when(buildDao.findById(1)).thenReturn(build);
        when(partDao.findById(2)).thenReturn(part);

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.addPartToBuild(
                                1,
                                2,
                                0,
                                "alice",
                                false
                        )
                );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verify(
                buildDao,
                never()
        ).addPartToBuild(
                anyInt(),
                anyInt(),
                anyInt()
        );
    }

    @Test
    void getPartsInBuildHidesOtherUsersPrivateParts() {

        Build publicBuild = build(1, "alice", true);

        Part publicPart = new Part();
        publicPart.setId(2);
        publicPart.setUsername("bob");
        publicPart.setIs_Public(true);

        Part ownPrivatePart = new Part();
        ownPrivatePart.setId(3);
        ownPrivatePart.setUsername("alice");
        ownPrivatePart.setIs_Public(false);

        Part otherPrivatePart = new Part();
        otherPrivatePart.setId(4);
        otherPrivatePart.setUsername("bob");
        otherPrivatePart.setIs_Public(false);

        when(buildDao.findById(1)).thenReturn(publicBuild);

        when(buildDao.findPartsByBuildId(1))
                .thenReturn(List.of(
                        publicPart,
                        ownPrivatePart,
                        otherPrivatePart
                ));

        List<Part> results =
                service.getPartsInBuild(
                        1,
                        "alice",
                        false
                );

        assertEquals(
                List.of(publicPart, ownPrivatePart),
                results
        );

        assertFalse(results.contains(otherPrivatePart));
    }

    @Test
    void canAddAnotherUsersPublicPartToOwnBuild() {

        Build build = build(1, "alice", true);

        Part publicPart = new Part();
        publicPart.setId(2);
        publicPart.setUsername("bob");
        publicPart.setIs_Public(true);

        when(buildDao.findById(1)).thenReturn(build);
        when(partDao.findById(2)).thenReturn(publicPart);

        service.addPartToBuild(
                1,
                2,
                1,
                "alice",
                false
        );

        verify(buildDao).addPartToBuild(1, 2, 1);
    }

    @Test
    void addPartToBuildReturnsNotFoundWhenPartDoesNotExist() {

        Build build = build(1, "alice", true);

        when(buildDao.findById(1)).thenReturn(build);
        when(partDao.findById(99)).thenReturn(null);

        ResponseStatusException error =
                assertThrows(
                        ResponseStatusException.class,
                        () -> service.addPartToBuild(
                                1,
                                99,
                                1,
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

        verify(
                buildDao,
                never()
        ).addPartToBuild(
                anyInt(),
                anyInt(),
                anyInt()
        );
    }


    private static Build build(int id, String username, boolean isPublic) {
        Build build = new Build();
        build.setId(id);
        build.setUsername(username);
        build.setIs_Public(isPublic);
        return build;
    }
}