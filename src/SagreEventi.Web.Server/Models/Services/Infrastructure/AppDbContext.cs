using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Models.Entities;
using SagreEventi.Web.Server.Models.Identity;

namespace SagreEventi.Web.Server.Models.Services.Infrastructure;

/// <summary>Application database context: events, the moderation states lookup and the ASP.NET Core Identity tables.</summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Evento> Eventi { get; set; }

    /// <summary>Lookup table with the values of <c>StatoModerazione</c>, referenced by <c>Eventi.Stato</c>.</summary>
    public DbSet<StatoModerazioneLookup> StatiModerazione { get; set; }

    /// <summary>Configurable periods of the seasonal themes.</summary>
    public DbSet<PeriodoTema> PeriodiTema { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PeriodoTema>(entity =>
        {
            entity.ToTable("PeriodiTema");
            entity.HasKey(periodo => periodo.Chiave);
            entity.Property(periodo => periodo.Chiave).HasMaxLength(20);
            entity.HasData(
                new PeriodoTema { Chiave = "pasqua", GiorniPrimaPasqua = 7, GiorniDopoPasqua = 1 },
                new PeriodoTema { Chiave = "ferragosto", GiornoInizio = 1, MeseInizio = 8, GiornoFine = 20, MeseFine = 8 },
                new PeriodoTema { Chiave = "halloween", GiornoInizio = 24, MeseInizio = 10, GiornoFine = 31, MeseFine = 10 },
                new PeriodoTema { Chiave = "natale", GiornoInizio = 1, MeseInizio = 12, GiornoFine = 6, MeseFine = 1 });
        });

        modelBuilder.Entity<Evento>(entity =>
        {
            entity.ToTable("Eventi");
            entity.HasKey(evento => evento.Id);
            entity.Property(evento => evento.NomeEvento).IsRequired();
            entity.Property(evento => evento.CittaEvento).IsRequired();
            entity.Property(evento => evento.Indirizzo).HasMaxLength(EventoModel.MaxIndirizzoLength);
            entity.Property(evento => evento.Latitudine).HasPrecision(9, 6);
            entity.Property(evento => evento.Longitudine).HasPrecision(9, 6);
            entity.Property(evento => evento.DescrizioneEvento).IsRequired();
            entity.Property(evento => evento.MotivoRifiuto).HasMaxLength(500);
            entity.Property(evento => evento.RevisionatoDa).HasMaxLength(256);
            entity.HasOne<StatoModerazioneLookup>().WithMany().HasForeignKey(evento => evento.Stato).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StatoModerazioneLookup>(entity =>
        {
            entity.ToTable("StatiModerazione");
            entity.HasKey(stato => stato.Id);
            entity.Property(stato => stato.Id).ValueGeneratedNever();
            entity.Property(stato => stato.Nome).IsRequired().HasMaxLength(50);
            entity.HasData(Enum.GetValues<StatoModerazione>()
                .Select(valore => new StatoModerazioneLookup { Id = valore, Nome = valore.ToString() }));
        });
    }
}
