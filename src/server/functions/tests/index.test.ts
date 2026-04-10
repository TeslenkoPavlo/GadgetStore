import * as crypto from "crypto";

// Mock Firebase and other initializations to isolate the unit tests
jest.mock("firebase-admin/app", () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
}));
jest.mock("firebase-admin/firestore", () => ({
    getFirestore: jest.fn(),
}));
jest.mock("firebase-admin/auth", () => ({
    getAuth: jest.fn(),
}));
jest.mock("firebase-functions/v2/https", () => ({
    onRequest: jest.fn(),
}));
jest.mock("@google-cloud/vertexai", () => ({
    VertexAI: jest.fn(),
}));

// Import after mocking
import { verifyLiqPaySignature, generateChatTitle } from "../src/index";

describe("Utility Functions Tests", () => {
    describe("verifyLiqPaySignature", () => {
        const originalEnv = process.env;
        const mockPrivateKey = "test_private_key";

        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv, LIQPAY_PRIVATE_KEY: mockPrivateKey };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it("should return true for a valid signature", () => {
            const data = "base64_encoded_payment_data";

            // Manually calculate the correct signature based on the mock key
            const expectedSignature = crypto
                .createHash("sha1")
                .update(mockPrivateKey + data + mockPrivateKey)
                .digest("base64");

            const result = verifyLiqPaySignature(data, expectedSignature);
            expect(result).toBe(true);
        });

        it("should return false for an invalid signature", () => {
            const data = "base64_encoded_payment_data";
            const fakeSignature = "invalid_random_signature_string";

            const result = verifyLiqPaySignature(data, fakeSignature);
            expect(result).toBe(false);
        });
    });

    describe("generateChatTitle", () => {
        it("should return the original message if it is 50 characters or less", () => {
            const shortMessage = "Hello, I need help with an order.";
            const result = generateChatTitle(shortMessage);
            expect(result).toBe(shortMessage);
        });

        it("should replace newlines with spaces and trim the string", () => {
            const messageWithNewlines = "  Hello \n I have a \n question.  ";
            const result = generateChatTitle(messageWithNewlines);
            expect(result).toBe("Hello   I have a   question.");
        });

        it("should truncate messages longer than 50 characters and append '...'", () => {
            const longMessage = "This is a very long message that definitely exceeds the fifty character limit for generating a chat title.";
            // The first 50 characters of this trimmed string:
            // "This is a very long message that definitely exceed"
            const expectedTitle = "This is a very long message that definitely exceed...";

            const result = generateChatTitle(longMessage);

            expect(result.length).toBe(53); // 50 chars + 3 dots
            expect(result).toBe(expectedTitle);
            expect(result.endsWith("...")).toBe(true);
        });
    });
});
