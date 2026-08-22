package org.example.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.example.daos.BuildDao;
import org.example.daos.PartDao;
import org.example.models.Build;
import org.example.models.PageResult;
import org.example.models.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class BuildServiceTest {

    private BuildDao buildDao;
    private PartDao partDao;
    private BuildService buildService;

    @BeforeEach
    void setUp() {
        buildDao = mock(BuildDao.class);
        partDao = mock(PartDao.class);
        buildService = new BuildService(buildDao, partDao);
    }

    private Build build(String name, String username, boolean isPublic) {
        Build build = new Build();
        build.setName(name);
        build.setDescription("Test build");
        build.setUsername(username);
        build.setIs_Public(isPublic);
        return build;
    }

    private Part part(String username, boolean isPublic) {
        Part part = new Part();
        part.setName("RTX 5070");
        part.setCategory("GPU");
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
    void create_validBuild_forcesAuthenticatedOwnerAndPersists() {
        Build build = build("Gaming PC", "spoofed", true);

        Build result = buildService.create(build, "alice");

        assertSame(build, result);
        assertEquals("alice", result.getUsername());
        verify(buildDao).create(build);
    }

    @Test
    void create_nullBuild_throwsBadRequest() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> buildService.create(null, "alice"));
        verifyNoInteractions(buildDao);
    }

    @Test
    void create_blankName_throwsBadRequest() {
        Build build = build("   ", "alice", true);

        assertStatus(HttpStatus.BAD_REQUEST, () -> buildService.create(build, "alice"));
        verifyNoInteractions(buildDao);
    }

    @Test
    void create_nameOver255Characters_throwsBadRequest() {
        Build build = build("x".repeat(256), "alice", true);

        assertStatus(HttpStatus.BAD_REQUEST, () -> buildService.create(build, "alice"));
        verifyNoInteractions(buildDao);
    }

    @Test
    void findById_missingBuild_throwsNotFound() {
        when(buildDao.findById(7)).thenReturn(null);

        assertStatus(HttpStatus.NOT_FOUND, () -> buildService.findById(7, "alice", false));
    }

    @Test
    void findById_publicBuild_allowsOtherUser() {
        Build build = build("Public Build", "bob", true);
        when(buildDao.findById(7)).thenReturn(build);

        assertSame(build, buildService.findById(7, "alice", false));
    }

    @Test
    void findById_privateBuild_allowsOwner() {
        Build build = build("Private Build", "alice", false);
        when(buildDao.findById(7)).thenReturn(build);

        assertSame(build, buildService.findById(7, "alice", false));
    }

    @Test
    void findById_privateBuild_allowsAdmin() {
        Build build = build("Private Build", "bob", false);
        when(buildDao.findById(7)).thenReturn(build);

        assertSame(build, buildService.findById(7, "admin", true));
    }

    @Test
    void findById_privateBuild_blocksOtherUser() {
        Build build = build("Private Build", "bob", false);
        when(buildDao.findById(7)).thenReturn(build);

        assertStatus(HttpStatus.FORBIDDEN, () -> buildService.findById(7, "alice", false));
    }

    @Test
    void findMine_delegatesToDao() {
        List<Build> expected = List.of(build("Mine", "alice", false));
        when(buildDao.findByUsername("alice")).thenReturn(expected);

        assertSame(expected, buildService.findMine("alice"));
        verify(buildDao).findByUsername("alice");
    }

    @Test
    void search_validPagination_delegatesToDao() {
        PageResult<Build> expected = new PageResult<>(List.of(new Build()), 2, 12, 27L, 3);
        when(buildDao.search("gaming", "Public", "created_at", "DESC", 2, 12, "alice", false))
                .thenReturn(expected);

        PageResult<Build> actual = buildService.search(
                "gaming", "Public", "created_at", "DESC", 2, 12, "alice", false);

        assertSame(expected, actual);
        verify(buildDao).search("gaming", "Public", "created_at", "DESC", 2, 12, "alice", false);
    }

    @Test
    void search_expandedFilters_delegatesToDao() {
        PageResult<Build> expected = new PageResult<>(List.of(), 0, 12, 0L, 0);
        when(buildDao.search(
                "gaming", "Public", "alice", "GPU", "RTX", true,
                "name", "ASC", 0, 12, "admin", true))
                .thenReturn(expected);

        PageResult<Build> actual = buildService.search(
                "gaming", "Public", "alice", "GPU", "RTX", true,
                "name", "ASC", 0, 12, "admin", true);

        assertSame(expected, actual);
        verify(buildDao).search(
                "gaming", "Public", "alice", "GPU", "RTX", true,
                "name", "ASC", 0, 12, "admin", true);
    }

    @Test
    void search_negativePage_throwsBadRequest() {
        assertStatus(HttpStatus.BAD_REQUEST,
                () -> buildService.search(null, "All", "name", "ASC", -1, 12, "alice", false));
        verifyNoInteractions(buildDao);
    }

    @Test
    void search_zeroSize_throwsBadRequest() {
        assertStatus(HttpStatus.BAD_REQUEST,
                () -> buildService.search(null, "All", "name", "ASC", 0, 0, "alice", false));
        verifyNoInteractions(buildDao);
    }

    @Test
    void search_sizeAboveMaximum_throwsBadRequest() {
        assertStatus(HttpStatus.BAD_REQUEST,
                () -> buildService.search(null, "All", "name", "ASC", 0, 51, "alice", false));
        verifyNoInteractions(buildDao);
    }

    @Test
    void search_boundarySizes_areAllowed() {
        PageResult<Build> min = new PageResult<>(List.of(), 0, 1, 0L, 0);
        PageResult<Build> max = new PageResult<>(List.of(), 0, 50, 0L, 0);
        when(buildDao.search(null, "All", "name", "ASC", 0, 1, "alice", false)).thenReturn(min);
        when(buildDao.search(null, "All", "name", "ASC", 0, 50, "alice", false)).thenReturn(max);

        assertSame(min, buildService.search(null, "All", "name", "ASC", 0, 1, "alice", false));
        assertSame(max, buildService.search(null, "All", "name", "ASC", 0, 50, "alice", false));
    }

    @Test
    void update_missingBuild_throwsNotFound() {
        when(buildDao.findById(4)).thenReturn(null);

        assertStatus(HttpStatus.NOT_FOUND,
                () -> buildService.update(4, build("Updated", "alice", true), "alice", false));
        verify(buildDao, never()).update(any());
    }

    @Test
    void update_nonOwner_throwsForbiddenBeforeValidation() {
        when(buildDao.findById(4)).thenReturn(build("Existing", "bob", true));

        assertStatus(HttpStatus.FORBIDDEN,
                () -> buildService.update(4, build("Updated", "alice", true), "alice", false));
        verify(buildDao, never()).update(any());
    }

    @Test
    void update_owner_updatesEditableFieldsAndPersistsExistingObject() {
        Build existing = build("Old", "alice", false);
        Build updated = build("New", "ignored", true);
        updated.setDescription("Updated description");
        when(buildDao.findById(4)).thenReturn(existing);

        Build result = buildService.update(4, updated, "alice", false);

        assertSame(existing, result);
        assertEquals("New", existing.getName());
        assertEquals("Updated description", existing.getDescription());
        assertTrue(existing.getIs_Public());
        assertEquals("alice", existing.getUsername());
        verify(buildDao).update(existing);
    }

    @Test
    void update_admin_canEditAnotherUsersBuild() {
        Build existing = build("Old", "bob", false);
        Build updated = build("Admin Edit", "ignored", true);
        when(buildDao.findById(4)).thenReturn(existing);

        Build result = buildService.update(4, updated, "admin", true);

        assertEquals("Admin Edit", result.getName());
        assertEquals("bob", result.getUsername());
        verify(buildDao).update(existing);
    }

    @Test
    void update_invalidBuild_throwsBadRequestForAuthorizedOwner() {
        Build existing = build("Old", "alice", false);
        Build updated = build("", "alice", true);
        when(buildDao.findById(4)).thenReturn(existing);

        assertStatus(HttpStatus.BAD_REQUEST,
                () -> buildService.update(4, updated, "alice", false));
        verify(buildDao, never()).update(any());
    }

    @Test
    void delete_missingBuild_throwsNotFound() {
        when(buildDao.findById(4)).thenReturn(null);

        assertStatus(HttpStatus.NOT_FOUND, () -> buildService.delete(4, "alice", false));
        verify(buildDao, never()).delete(anyInt());
    }

    @Test
    void delete_nonOwner_throwsForbidden() {
        when(buildDao.findById(4)).thenReturn(build("Build", "bob", true));

        assertStatus(HttpStatus.FORBIDDEN, () -> buildService.delete(4, "alice", false));
        verify(buildDao, never()).delete(anyInt());
    }

    @Test
    void delete_owner_deletesBuild() {
        when(buildDao.findById(4)).thenReturn(build("Build", "alice", false));

        buildService.delete(4, "alice", false);

        verify(buildDao).delete(4);
    }

    @Test
    void delete_admin_deletesOtherUsersBuild() {
        when(buildDao.findById(4)).thenReturn(build("Build", "bob", false));

        buildService.delete(4, "admin", true);

        verify(buildDao).delete(4);
    }

    @Test
    void addPartToBuild_ownerCanAddPublicPart() {
        when(buildDao.findById(1)).thenReturn(build("Build", "alice", false));
        when(partDao.findById(2)).thenReturn(part("bob", true));

        buildService.addPartToBuild(1, 2, 3, "alice", false);

        verify(buildDao).addPartToBuild(1, 2, 3);
    }

    @Test
    void addPartToBuild_nonOwnerCannotModifyPublicBuild() {
        when(buildDao.findById(1)).thenReturn(build("Build", "bob", true));

        assertStatus(HttpStatus.FORBIDDEN,
                () -> buildService.addPartToBuild(1, 2, 1, "alice", false));
        verifyNoInteractions(partDao);
        verify(buildDao, never()).addPartToBuild(anyInt(), anyInt(), anyInt());
    }

    @Test
    void addPartToBuild_missingPart_throwsNotFound() {
        when(buildDao.findById(1)).thenReturn(build("Build", "alice", false));
        when(partDao.findById(2)).thenReturn(null);

        assertStatus(HttpStatus.NOT_FOUND,
                () -> buildService.addPartToBuild(1, 2, 1, "alice", false));
    }

    @Test
    void addPartToBuild_otherUsersPrivatePart_throwsForbidden() {
        when(buildDao.findById(1)).thenReturn(build("Build", "alice", false));
        when(partDao.findById(2)).thenReturn(part("bob", false));

        assertStatus(HttpStatus.FORBIDDEN,
                () -> buildService.addPartToBuild(1, 2, 1, "alice", false));
        verify(buildDao, never()).addPartToBuild(anyInt(), anyInt(), anyInt());
    }

    @Test
    void addPartToBuild_nonPositiveQuantity_throwsBadRequest() {
        when(buildDao.findById(1)).thenReturn(build("Build", "alice", false));
        when(partDao.findById(2)).thenReturn(part("alice", false));

        assertStatus(HttpStatus.BAD_REQUEST,
                () -> buildService.addPartToBuild(1, 2, 0, "alice", false));
        verify(buildDao, never()).addPartToBuild(anyInt(), anyInt(), anyInt());
    }

    @Test
    void addPartToBuild_adminCanModifyOtherBuildWithPrivatePart() {
        when(buildDao.findById(1)).thenReturn(build("Build", "bob", false));
        when(partDao.findById(2)).thenReturn(part("charlie", false));

        buildService.addPartToBuild(1, 2, 1, "admin", true);

        verify(buildDao).addPartToBuild(1, 2, 1);
    }

    @Test
    void removePartFromBuild_ownerCanRemovePart() {
        when(buildDao.findById(1)).thenReturn(build("Build", "alice", false));

        buildService.removePartFromBuild(1, 2, "alice", false);

        verify(buildDao).removePartFromBuild(1, 2);
    }

    @Test
    void removePartFromBuild_nonOwnerCannotModifyPublicBuild() {
        when(buildDao.findById(1)).thenReturn(build("Build", "bob", true));

        assertStatus(HttpStatus.FORBIDDEN,
                () -> buildService.removePartFromBuild(1, 2, "alice", false));
        verify(buildDao, never()).removePartFromBuild(anyInt(), anyInt());
    }

    @Test
    void getPartsInBuild_nonAdminSeesPublicAndOwnPrivatePartsOnly() {
        Build build = build("Build", "alice", false);
        Part publicPart = part("bob", true);
        Part ownPrivatePart = part("alice", false);
        Part otherPrivatePart = part("bob", false);
        when(buildDao.findById(1)).thenReturn(build);
        when(buildDao.findPartsByBuildId(1)).thenReturn(List.of(publicPart, ownPrivatePart, otherPrivatePart));

        List<Part> result = buildService.getPartsInBuild(1, "alice", false);

        assertEquals(List.of(publicPart, ownPrivatePart), result);
    }

    @Test
    void getPartsInBuild_adminSeesAllParts() {
        when(buildDao.findById(1)).thenReturn(build("Build", "bob", false));
        List<Part> parts = List.of(part("bob", false), part("charlie", false));
        when(buildDao.findPartsByBuildId(1)).thenReturn(parts);

        assertSame(parts, buildService.getPartsInBuild(1, "admin", true));
    }
}
