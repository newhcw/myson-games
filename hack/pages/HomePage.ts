import { type Page, type Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly gameTitle: Locator;
  readonly startButton: Locator;
  readonly settingsButton: Locator;
  readonly exitButton: Locator;
  readonly menuButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.gameTitle = page.locator('.game-title');
    this.startButton = page.locator('.start-button');
    this.settingsButton = page.locator('.settings-button');
    this.exitButton = page.locator('.exit-button');
    this.menuButtons = page.locator('.menu-button');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickStartButton() {
    await this.startButton.click();
  }

  async clickSettingsButton() {
    await this.settingsButton.click();
  }

  async clickExitButton() {
    await this.exitButton.click();
  }

  async expectLoaded() {
    await expect(this.gameTitle).toBeVisible();
    await expect(this.menuButtons).toHaveCount(3);
  }
}