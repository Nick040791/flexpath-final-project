import { create } from "react-test-renderer";
import VisibilityBadge from "./VisibilityBadge";

describe("VisibilityBadge", () => {
    test.each([
        [true, "Public"],
        [false, "Private"],
    ])("renders %s visibility as %s", (isPublic, expected) => {
        const badge = create(<VisibilityBadge isPublic={isPublic} />).root.findByType("span");
        expect(badge.children).toEqual([expected]);
    });
});