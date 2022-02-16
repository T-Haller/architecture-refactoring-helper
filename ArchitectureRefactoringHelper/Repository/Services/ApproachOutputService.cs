using Microsoft.EntityFrameworkCore;
using Repository.Exceptions;
using Repository.Models;

namespace Repository.Services;

public class ApproachOutputService
{
    public IEnumerable<ApproachOutput> ListApproachOutputs()
    {
        using (var db = new RefactoringApproachContext())
        {
            var list = db.ApproachOutputs
                .IncludeAllApproachOutputData()
                .ToList();
            return list;
        }
    }

    public IEnumerable<Architecture> ListArchitectures()
    {
        using (var db = new RefactoringApproachContext())
        {
            return db.Architectures.ToList();
        }
    }

    public IEnumerable<ServiceType> ListServiceTypes()
    {
        using (var db = new RefactoringApproachContext())
        {
            return db.ServiceTypes.ToList();
        }
    }

    public ApproachOutput GetApproachOutput(int outputId)
    {
        using (var db = new RefactoringApproachContext())
        {
            var output = db.ApproachOutputs
                .Where(e => e.ApproachOutputId == outputId)
                .IncludeAllApproachOutputData()
                .FirstOrDefault();
            if (output == null)
            {
                throw new ElementNotFoundExceptions($"Approach output with ID '{outputId}' does not exist.");
            }

            return output;
        }
    }

    public ApproachOutput AddApproachOutputIfNotExists(ApproachOutput output)
    {
        var savedOutput = FindDuplicateApproachOutput(output);
        return savedOutput ?? AddApproachOutput(output);
    }

    private ApproachOutput AddApproachOutput(ApproachOutput output)
    {
        using (var db = new RefactoringApproachContext())
        {
            var preparedOutput = new ApproachOutput
            {
                Architecture = db.Architectures.Find(output.Architecture.Name) ??
                               throw new InvalidOperationException(),
                ServiceType = db.ServiceTypes.Find(output.ServiceType.Name) ??
                              throw new InvalidOperationException()
            };

            var savedOutput = db.ApproachOutputs.Add(preparedOutput);
            db.SaveChanges();
            return savedOutput.Entity;
        }
    }

    public void AddApproachOutputsIfNotExist(IEnumerable<ApproachOutput>? outputs)
    {
        if (outputs == null)
            return;

        using (var db = new RefactoringApproachContext())
        {
            foreach (var output in outputs)
            {
                if (db.ApproachOutputs.Any(e =>
                        e.Architecture.Equals(output.Architecture) && e.ServiceType.Equals(output.ServiceType)))
                {
                    break;
                }

                var preparedOutput = new ApproachOutput
                {
                    Architecture = db.Architectures.Find(output.Architecture.Name) ??
                                   throw new InvalidOperationException(),
                    ServiceType = db.ServiceTypes.Find(output.ServiceType.Name) ??
                                  throw new InvalidOperationException()
                };
                db.ApproachOutputs.Add(preparedOutput);
            }

            db.SaveChanges();
        }
    }

    public void AddArchitecture(Architecture architecture)
    {
        using (var db = new RefactoringApproachContext())
        {
            db.Architectures.Add(architecture);
            db.SaveChanges();
        }
    }

    public void AddServiceType(ServiceType serviceType)
    {
        using (var db = new RefactoringApproachContext())
        {
            db.ServiceTypes.Add(serviceType);
            db.SaveChanges();
        }
    }

    public void DeleteArchitecture(string name)
    {
        using (var db = new RefactoringApproachContext())
        {
            var architecture = db.Architectures.Find(name);
            if (architecture == null)
                return;
            db.Architectures.Remove(architecture);
            db.SaveChanges();
        }
    }

    public void DeleteServiceType(string name)
    {
        using (var db = new RefactoringApproachContext())
        {
            var serviceType = db.ServiceTypes.Find(name);
            if (serviceType == null)
                return;
            db.ServiceTypes.Remove(serviceType);
            db.SaveChanges();
        }
    }

    private ApproachOutput? FindDuplicateApproachOutput(ApproachOutput output)
    {
        using (var db = new RefactoringApproachContext())
        {
            return db.ApproachOutputs
                .Where(e => e.Architecture.Equals(output.Architecture))
                .Where(e => e.ServiceType.Equals(output.ServiceType))
                .IncludeAllApproachOutputData()
                .FirstOrDefault();
        }
    }
}