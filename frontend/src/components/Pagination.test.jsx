import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import Pagination from "./Pagination";


describe("Pagination", () => {

    test("displays backend page 0 as Page 1", () => {

        render(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={vi.fn()}
            />
        );

        expect(
            screen.getByText("Page 1 of 5")
        ).toBeInTheDocument();
    });


    test("Previous is disabled on the first page", () => {

        render(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", {
                name: "Previous"
            })
        ).toBeDisabled();
    });


    test("Next is enabled when not on the last page", () => {

        render(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", {
                name: "Next"
            })
        ).not.toBeDisabled();
    });


    test("Next is disabled on the last page", () => {

        render(
            <Pagination
                page={4}
                totalPages={5}
                loading={false}
                onPageChange={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", {
                name: "Next"
            })
        ).toBeDisabled();
    });


    test("Previous calls onPageChange with page minus one", () => {

        const onPageChange = vi.fn();

        render(
            <Pagination
                page={2}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Previous"
            })
        );

        expect(onPageChange)
            .toHaveBeenCalledTimes(1);

        expect(onPageChange)
            .toHaveBeenCalledWith(1);
    });


    test("Next calls onPageChange with page plus one", () => {

        const onPageChange = vi.fn();

        render(
            <Pagination
                page={2}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Next"
            })
        );

        expect(onPageChange)
            .toHaveBeenCalledTimes(1);

        expect(onPageChange)
            .toHaveBeenCalledWith(3);
    });


    test("displays the correct human-readable page number", () => {

        render(
            <Pagination
                page={2}
                totalPages={5}
                loading={false}
                onPageChange={vi.fn()}
            />
        );

        expect(
            screen.getByText("Page 3 of 5")
        ).toBeInTheDocument();
    });


    test("loading disables both navigation buttons", () => {

        render(
            <Pagination
                page={2}
                totalPages={5}
                loading={true}
                onPageChange={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", {
                name: "Previous"
            })
        ).toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Next"
            })
        ).toBeDisabled();
    });


    test("single-page results disable both buttons", () => {

        render(
            <Pagination
                page={0}
                totalPages={1}
                loading={false}
                onPageChange={vi.fn()}
            />
        );

        expect(
            screen.getByRole("button", {
                name: "Previous"
            })
        ).toBeDisabled();

        expect(
            screen.getByRole("button", {
                name: "Next"
            })
        ).toBeDisabled();

        expect(
            screen.getByText("Page 1 of 1")
        ).toBeInTheDocument();
    });


    test("renders no pagination controls when there are no pages", () => {

        const { container } = render(
            <Pagination
                page={0}
                totalPages={0}
                loading={false}
                onPageChange={vi.fn()}
            />
        );

        expect(container)
            .toBeEmptyDOMElement();
    });


    test("clicking disabled Previous does not call onPageChange", () => {

        const onPageChange = vi.fn();

        render(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Previous"
            })
        );

        expect(onPageChange)
            .not.toHaveBeenCalled();
    });


    test("clicking disabled Next does not call onPageChange", () => {

        const onPageChange = vi.fn();

        render(
            <Pagination
                page={4}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Next"
            })
        );

        expect(onPageChange)
            .not.toHaveBeenCalled();
    });
});