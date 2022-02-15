using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Repository.Models;

[Table(Constants.TABLE_NAME_APPROACH_PROCESS_QUALITY)]
public class Quality
{
    [Key]
    public string Name { get; set; }
    public string? Description { get; set; }
    public QualityCategory Category { get; set; }

    [JsonIgnore]
    public ICollection<ApproachProcess>? ApproachProcesses { get; set; }
}

public enum QualityCategory
{
    Requirement,
    Metric
}