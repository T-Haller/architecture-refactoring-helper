﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    public partial class ScenariosAdded : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ScenarioId",
                table: "Approach.Process.Quality",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: ".Scenario",
                columns: table => new
                {
                    ScenarioId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Difficulty = table.Column<string>(type: "TEXT", nullable: true),
                    Importance = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_.Scenario", x => x.ScenarioId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Approach.Process.Quality_ScenarioId",
                table: "Approach.Process.Quality",
                column: "ScenarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Approach.Process.Quality_.Scenario_ScenarioId",
                table: "Approach.Process.Quality",
                column: "ScenarioId",
                principalTable: ".Scenario",
                principalColumn: "ScenarioId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Approach.Process.Quality_.Scenario_ScenarioId",
                table: "Approach.Process.Quality");

            migrationBuilder.DropTable(
                name: ".Scenario");

            migrationBuilder.DropIndex(
                name: "IX_Approach.Process.Quality_ScenarioId",
                table: "Approach.Process.Quality");

            migrationBuilder.DropColumn(
                name: "ScenarioId",
                table: "Approach.Process.Quality");
        }
    }
}