import { test, expect } from "@playwright/test"

test("administrator finds a student, contacts families and downloads documents", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Email address").fill("admin@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Campaign overview" })).toBeVisible()
  await expect(page.getByText(/of 300 students have every required vaccine/)).toBeVisible()

  // find a student from the header search
  await page.getByLabel("Find a student").fill("st-002")
  await page.getByRole("option").first().click()
  await expect(page.getByRole("button", { name: /Download record/ })).toBeVisible()
  const [record] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download record/ }).click(),
  ])
  expect(record.suggestedFilename()).toContain("immunization-record-demo.pdf")
  await page.getByRole("button", { name: "Back to students" }).click()

  // work a queue and contact families
  await page.getByRole("button", { name: "Missing doses, no visit" }).click()
  await page.getByLabel("Select all on this page").check()
  await expect(page.getByText("25 selected")).toBeVisible()
  await page.getByRole("button", { name: "Contact families", exact: true }).click()
  await expect(page.getByText("Template, edited by a person")).toBeVisible()
  await page.getByLabel(/I reviewed this message/).check()
  await page.getByRole("button", { name: /^Send to 25 families/ }).click()
  await expect(page.getByText(/Simulated: nothing was emailed/)).toBeVisible()

  // reports downloads
  await page.getByRole("tab", { name: "Reports" }).click()
  await expect(page.getByRole("heading", { name: "Students by category" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Nonmedical exemption" })).toBeVisible()
  const [report] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Compliance report, all students/ }).click(),
  ])
  expect(report.suggestedFilename()).toContain("compliance-report")
})
