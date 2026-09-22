import uvicorn

if __name__ == "__main__":
    # Only application code triggers a reload; editing tests or scripts must not restart a running server.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["app"])
