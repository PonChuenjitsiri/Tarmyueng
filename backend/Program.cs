using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using ExpenseTracker.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Tarmyueng API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<BillingEngineService>();
builder.Services.AddScoped<EasySlipService>();
builder.Services.AddScoped<SlipVerificationService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddSingleton<MinioService>();
builder.Services.AddScoped<IPasswordHashingService, PasswordHashingService>();
builder.Services.AddHostedService<BillingSchedulerService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "super_secret_dev_key_that_is_very_long_for_security_reasons!")),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration["AllowedOrigins"]?.Split(',')
        ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174" };

    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

var app = builder.Build();

// Enable Swagger for all environments (can be disabled in production if needed)
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

try
{
    using (var scope = app.Services.CreateScope())
    {
        Console.WriteLine("Running database migrations...");
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        Console.WriteLine("Database migrations completed.");

        // Seed admin user
        Console.WriteLine("Seeding admin user...");
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHashingService>();
        var adminEmail = "ponzajaa@gmail.com";
        var adminExists = await db.Users.AnyAsync(u => u.Email == adminEmail);

        if (!adminExists)
        {
            var hashedPassword = passwordHasher.HashPassword("Jammy3018");
            var adminUser = new User
            {
                Username = "Pon",
                Email = adminEmail,
                PasswordHash = hashedPassword,
                Role = "Admin",
                PromptPayId = "0869166078",
                IsActive = true
            };
            db.Users.Add(adminUser);
            await db.SaveChangesAsync();
            Console.WriteLine("✅ Admin user seeded successfully.");
        }
        else
        {
            Console.WriteLine("Admin user already exists.");
        }

        Console.WriteLine("Initializing Minio...");
        var minioService = scope.ServiceProvider.GetRequiredService<MinioService>();
        await minioService.EnsureBucketAsync();
        Console.WriteLine("Minio Initialized.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[Startup] Initialization failed: {ex.Message}");
}
Console.WriteLine("App Starting...");
app.Run();
