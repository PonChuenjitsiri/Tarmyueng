using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace ExpenseTracker.Api.Tests;

public class BillingEngineServiceTests
{
    [Fact]
    public async Task GenerateMonthlyBillsAsync_WithActiveBillingDaySubscriptions_CreatesBills()
    {
        var today = DateTime.UtcNow;
        var mockDbContext = CreateMockDbContext();

        var template = new SubscriptionTemplate
        {
            Id = 1,
            Name = "Rent Subscription",
            TotalAmount = 10000,
            BillingDayOfMonth = today.Day,
            IsActive = true,
            Participants = new List<SubscriptionParticipant>
            {
                new SubscriptionParticipant { Id = 1, UserId = 1, DefaultAmountOwed = 5000 },
                new SubscriptionParticipant { Id = 2, UserId = 2, DefaultAmountOwed = 5000 }
            }
        };

        var mockLogger = new Mock<ILogger<BillingEngineService>>();
        var service = new BillingEngineService(mockDbContext, mockLogger.Object);

        var queryable = new[] { template }.AsQueryable();
        var mockSet = new Mock<DbSet<SubscriptionTemplate>>();
        mockSet.As<IAsyncEnumerable<SubscriptionTemplate>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new AsyncEnumerator<SubscriptionTemplate>(queryable.GetEnumerator()));
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.Provider)
            .Returns(queryable.Provider);
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.Expression)
            .Returns(queryable.Expression);
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.ElementType)
            .Returns(queryable.ElementType);
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.GetEnumerator())
            .Returns(queryable.GetEnumerator());

        mockDbContext.SubscriptionTemplates = mockSet.Object;

        var billsQueryable = new List<MonthlyBill>().AsQueryable();
        var mockBillsSet = new Mock<DbSet<MonthlyBill>>();
        mockBillsSet.As<IAsyncEnumerable<MonthlyBill>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new AsyncEnumerator<MonthlyBill>(billsQueryable.GetEnumerator()));
        mockBillsSet.As<IQueryable<MonthlyBill>>()
            .Setup(m => m.Provider)
            .Returns(billsQueryable.Provider);
        mockBillsSet.As<IQueryable<MonthlyBill>>()
            .Setup(m => m.Expression)
            .Returns(billsQueryable.Expression);
        mockBillsSet.As<IQueryable<MonthlyBill>>()
            .Setup(m => m.ElementType)
            .Returns(billsQueryable.ElementType);
        mockBillsSet.As<IQueryable<MonthlyBill>>()
            .Setup(m => m.GetEnumerator())
            .Returns(billsQueryable.GetEnumerator());

        mockDbContext.MonthlyBills = mockBillsSet.Object;

        await service.GenerateMonthlyBillsAsync();

        mockSet.Verify(m => m.Include(It.IsAny<string>()), Times.Once);
        mockDbContext.Verify(m => m.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GenerateMonthlyBillsAsync_NoActiveBillings_DoesNotCreateBills()
    {
        var mockDbContext = CreateMockDbContext();
        var mockLogger = new Mock<ILogger<BillingEngineService>>();
        var service = new BillingEngineService(mockDbContext, mockLogger.Object);

        var queryable = new List<SubscriptionTemplate>().AsQueryable();
        var mockSet = new Mock<DbSet<SubscriptionTemplate>>();
        mockSet.As<IAsyncEnumerable<SubscriptionTemplate>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new AsyncEnumerator<SubscriptionTemplate>(queryable.GetEnumerator()));
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.Provider)
            .Returns(queryable.Provider);
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.Expression)
            .Returns(queryable.Expression);
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.ElementType)
            .Returns(queryable.ElementType);
        mockSet.As<IQueryable<SubscriptionTemplate>>()
            .Setup(m => m.GetEnumerator())
            .Returns(queryable.GetEnumerator());

        mockDbContext.SubscriptionTemplates = mockSet.Object;

        await service.GenerateMonthlyBillsAsync();

        mockDbContext.Verify(m => m.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    private Mock<AppDbContext> CreateMockDbContext()
    {
        var mockDbContext = new Mock<AppDbContext>();
        mockDbContext.Setup(m => m.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        return mockDbContext;
    }
}

public class AsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _enumerator;

    public AsyncEnumerator(IEnumerator<T> enumerator)
    {
        _enumerator = enumerator;
    }

    public T Current => _enumerator.Current;

    public async ValueTask<bool> MoveNextAsync()
    {
        return await Task.FromResult(_enumerator.MoveNext());
    }

    public async ValueTask DisposeAsync()
    {
        _enumerator.Dispose();
        await Task.CompletedTask;
    }
}
