package org.example.services;

import org.example.daos.BuildDao;
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
    private BuildDao dao;
    private BuildService service;

    @BeforeEach
    void setUp() {
        dao = mock(BuildDao.class);
        service = new BuildService(dao);
    }

    @Test
    void findByIdReturnsNotFoundWhenDaoReturnsNull() {
        when(dao.findById(99)).thenReturn(null);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.findById(99, "alice", false));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        assertEquals("Build not found", error.getReason());
    }

    @Test
    void privateBuildIsVisibleOnlyToOwnerOrAdmin() {
        Build privateBuild = build(1, "owner", false);
        when(dao.findById(1)).thenReturn(privateBuild);

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
        when(dao.search(null, "name", "ASC"))
                .thenReturn(List.of(publicBuild, ownedPrivate, otherPrivate));

        assertEquals(List.of(publicBuild, ownedPrivate),
                service.search(null, "name", "ASC", "alice", false));
        assertEquals(3, service.search(null, "name", "ASC", "admin", true).size());
    }

    @Test
    void updateRejectsMissingAndNonOwnedBuildWithoutWriting() {
        Build update = build(1, "alice", true);
        when(dao.findById(1)).thenReturn(null);
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class,
                        () -> service.update(1, update, "alice", false)).getStatusCode());

        when(dao.findById(1)).thenReturn(build(1, "other", false));
        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> service.update(1, update, "alice", false)).getStatusCode());
        verify(dao, never()).update(any(Build.class));
    }

    @Test
    void adminCanUpdateAndDeleteAnotherUsersBuild() {
        Build existing = build(1, "owner", false);
        Build update = build(1, "ignored", true);
        update.setName("Updated");
        update.setDescription("New description");
        when(dao.findById(1)).thenReturn(existing);

        Build result = service.update(1, update, "admin", true);
        service.delete(1, "admin", true);

        assertSame(existing, result);
        assertEquals("owner", result.getUsername());
        assertEquals("Updated", result.getName());
        verify(dao).update(existing);
        verify(dao).delete(1);
    }

    @Test
    void nonOwnerCannotMutatePublicBuildParts() {
        when(dao.findById(1)).thenReturn(build(1, "owner", true));

        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> service.addPartToBuild(1, 2, 1, "other", false)).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> service.removePartFromBuild(1, 2, "other", false)).getStatusCode());
        verify(dao, never()).addPartToBuild(anyInt(), anyInt(), anyInt());
        verify(dao, never()).removePartFromBuild(anyInt(), anyInt());
    }

    @Test
    void adminCanMutatePartsAndVisibilityIsCheckedBeforeReadingParts() {
        when(dao.findById(1)).thenReturn(build(1, "owner", false));
        Part part = new Part();
        part.setId(2);
        when(dao.findPartsByBuildId(1)).thenReturn(List.of(part));

        service.addPartToBuild(1, 2, 3, "admin", true);
        service.removePartFromBuild(1, 2, "admin", true);
        assertEquals(List.of(part), service.getPartsInBuild(1, "admin", true));

        verify(dao).addPartToBuild(1, 2, 3);
        verify(dao).removePartFromBuild(1, 2);
        verify(dao).findPartsByBuildId(1);
    }

    private static Build build(int id, String username, boolean isPublic) {
        Build build = new Build();
        build.setId(id);
        build.setUsername(username);
        build.setIs_Public(isPublic);
        return build;
    }
}