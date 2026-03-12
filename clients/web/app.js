const API_URL = window.CODESAGE_API_URL || "http://localhost:8000";

const loginForm = document.getElementById("login-form");
const analyzeForm = document.getElementById("analyze-form");
const output = document.getElementById("output");

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  output.textContent = "Logging in...";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      output.textContent = `Login failed (${response.status}): ${JSON.stringify(payload, null, 2)}`;
      return;
    }

    const token = payload.access_token || "";
    document.getElementById("token").value = token;
    output.textContent = `Login successful.\n\n${JSON.stringify(payload, null, 2)}`;
  } catch (error) {
    output.textContent = `Unable to reach API at ${API_URL}.\n\n${error}`;
  }
});

analyzeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  output.textContent = "Creating repository...";

  const token = document.getElementById("token").value.trim();
  const url = document.getElementById("repo-url").value;
  const branch = document.getElementById("branch").value;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const createResponse = await fetch(`${API_URL}/api/v1/repositories`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url, branch }),
    });

    const createPayload = await parseJsonResponse(createResponse);
    if (!createResponse.ok) {
      output.textContent = `Create repository failed (${createResponse.status}): ${JSON.stringify(createPayload, null, 2)}`;
      return;
    }

    output.textContent = "Repository created. Starting analysis...";

    const analyzeResponse = await fetch(`${API_URL}/api/v1/repositories/${createPayload.id}/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ analysis_types: ["security", "performance", "quality"] }),
    });

    const analyzePayload = await parseJsonResponse(analyzeResponse);
    if (!analyzeResponse.ok) {
      output.textContent = `Analysis start failed (${analyzeResponse.status}): ${JSON.stringify(analyzePayload, null, 2)}`;
      return;
    }

    output.textContent = JSON.stringify(
      {
        repository: createPayload,
        analysis: analyzePayload,
      },
      null,
      2,
    );
  } catch (error) {
    output.textContent = `Unable to reach API at ${API_URL}.\n\n${error}`;
  }
});
