using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ExpenseTracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBillingModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MonthlyBills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubscriptionTemplateId = table.Column<int>(type: "integer", nullable: false),
                    MonthYear = table.Column<string>(type: "text", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlyBills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthlyBills_SubscriptionTemplates_SubscriptionTemplateId",
                        column: x => x.SubscriptionTemplateId,
                        principalTable: "SubscriptionTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BillShares",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MonthlyBillId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AmountOwed = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillShares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillShares_MonthlyBills_MonthlyBillId",
                        column: x => x.MonthlyBillId,
                        principalTable: "MonthlyBills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BillShares_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BillShareId = table.Column<int>(type: "integer", nullable: false),
                    ReceiptImageUrl = table.Column<string>(type: "text", nullable: false),
                    BankTransactionRef = table.Column<string>(type: "text", nullable: false),
                    VerifiedAmount = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_BillShares_BillShareId",
                        column: x => x.BillShareId,
                        principalTable: "BillShares",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillShares_MonthlyBillId",
                table: "BillShares",
                column: "MonthlyBillId");

            migrationBuilder.CreateIndex(
                name: "IX_BillShares_UserId",
                table: "BillShares",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyBills_SubscriptionTemplateId",
                table: "MonthlyBills",
                column: "SubscriptionTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BankTransactionRef",
                table: "Payments",
                column: "BankTransactionRef",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BillShareId",
                table: "Payments",
                column: "BillShareId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "BillShares");

            migrationBuilder.DropTable(
                name: "MonthlyBills");
        }
    }
}
