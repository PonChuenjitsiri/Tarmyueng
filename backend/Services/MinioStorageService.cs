using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;

namespace ExpenseTracker.Api.Services;

public class MinioService
{
    private readonly AmazonS3Client _client;
    private readonly string _endpoint;
    private readonly string _publicUrl;
    private readonly string _bucketName;
    private readonly bool _secure;

    public MinioService(IConfiguration config)
    {
        _endpoint = config["MinIO:ServiceUrl"] ?? "localhost:9000";
        _publicUrl = config["MinIO:PublicUrl"] ?? "";
        _bucketName = config["MinIO:BucketName"] ?? "slips";
        string accessKey = config["MinIO:AccessKey"] ?? "admin";
        string secretKey = config["MinIO:SecretKey"] ?? "secretpassword";
        _secure = bool.TryParse(config["MinIO:Secure"], out bool sec) && sec;

        // Ensure endpoint has a scheme for the S3 ServiceURL
        string scheme = _secure ? "https" : "http";
        string cleanEndpoint = _endpoint.Replace("http://", "").Replace("https://", "");
        string serviceUrl = $"{scheme}://{cleanEndpoint}";

        Console.WriteLine($"[DEBUG] AccessKey: [{accessKey}]");
        Console.WriteLine($"[DEBUG] SecretKey: [{secretKey}]");
        Console.WriteLine($"[DEBUG] ServiceURL: [{serviceUrl}]");

        var s3Config = new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            ForcePathStyle = true,     
            AuthenticationRegion = "us-east-1"
        };

        _client = new AmazonS3Client(accessKey, secretKey, s3Config);
    }

    public async Task EnsureBucketAsync()
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

            var listResponse = await _client.ListBucketsAsync(cts.Token).ConfigureAwait(false);
            bool exists = listResponse.Buckets?.Exists(b => b.BucketName == _bucketName) ?? false;

            if (!exists)
            {
                await _client.PutBucketAsync(new PutBucketRequest
                {
                    BucketName = _bucketName,
                    UseClientRegion = true
                }, cts.Token).ConfigureAwait(false);

                Console.WriteLine($"✅ MinIO bucket '{_bucketName}' created");
            }
            else
            {
                Console.WriteLine($"✅ MinIO bucket '{_bucketName}' exists");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error ensuring bucket: {ex.Message}");
        }
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string objectName, string contentType = "image/png")
    {
        string cleanContentType = string.IsNullOrWhiteSpace(contentType) || contentType.Contains("multipart")
            ? "application/octet-stream"
            : contentType.Split(';')[0];

        fileStream.Position = 0;

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = objectName,
            InputStream = fileStream,
            ContentType = cleanContentType,
            AutoCloseStream = false,
            UseChunkEncoding = false    
        };

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        await _client.PutObjectAsync(request, cts.Token).ConfigureAwait(false);

        if (!string.IsNullOrEmpty(_publicUrl))
        {
            return $"{_publicUrl.TrimEnd('/')}/{_bucketName}/{objectName}";
        }

        string protocol = _secure ? "https" : "http";
        return $"{protocol}://{_endpoint}/{_bucketName}/{objectName}";
    }

    public async Task DeleteFileAsync(string objectName)
    {
        try
        {
            await _client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = objectName
            }).ConfigureAwait(false);
        }
        catch
        {
        }
    }

    public async Task SetBucketPublicAsync()
    {
        try
        {
            // Policy to allow public read access to the bucket
            string policy = @"{{
                ""Version"": ""2012-10-17"",
                ""Statement"": [
                    {{
                        ""Effect"": ""Allow"",
                        ""Principal"": {{
                            ""AWS"": ""*""
                        }},
                        ""Action"": [
                            ""s3:GetObject""
                        ],
                        ""Resource"": ""arn:aws:s3:::{0}/*""
                    }}
                ]
            }}";

            policy = string.Format(policy, _bucketName);

            await _client.PutBucketPolicyAsync(new Amazon.S3.Model.PutBucketPolicyRequest
            {
                BucketName = _bucketName,
                Policy = policy
            }).ConfigureAwait(false);

            Console.WriteLine($"✅ Bucket '{_bucketName}' set to public (read-only)");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️  Warning: Could not set bucket policy: {ex.Message}");
        }
    }
}
