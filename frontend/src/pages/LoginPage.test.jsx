jest.mock("../components/Login", () => ({ __esModule: true, default: () => <login-component /> }));

const { create } = require("react-test-renderer");
const LoginPage = require("./LoginPage").default;

test("renders the Login component", () => {
    expect(create(<LoginPage />).root.findByType("login-component")).toBeDefined();
});