"""
Scraper collection - all available job scrapers.
"""

from scrapers.kariera_mk import KarieraMkScraper
from scrapers.vrabotuvanje_mk import VrabotuvanjeMkScraper
from scrapers.apliciraj_mk import AplicirajMkScraper
from scrapers.najdirabota_mk import NajdiraboataMkScraper
from scrapers.vraboti_se import VrabotiSeScraper
from scrapers.jobs_com_mk import JobsComMkScraper
from scrapers.oglasizarabota_mk import OglasizarabotaMkScraper
from scrapers.thrivity_mk import ThrivityMkScraper
from scrapers.honorarec_mk import HonorarecMkScraper
from scrapers.imashchoek_mk import ImashchoekMkScraper
from scrapers.manpower_mk import ManpowerMkScraper
from scrapers.mkjob_com import MkjobComScraper

__all__ = [
    "KarieraMkScraper",
    "VrabotuvanjeMkScraper",
    "AplicirajMkScraper",
    "NajdiraboataMkScraper",
    "VrabotiSeScraper",
    "JobsComMkScraper",
    "OglasizarabotaMkScraper",
    "ThrivityMkScraper",
    "HonorarecMkScraper",
    "ImashchoekMkScraper",
    "ManpowerMkScraper",
    "MkjobComScraper",
]

SCRAPER_CLASSES = [
    KarieraMkScraper,
    VrabotuvanjeMkScraper,
    AplicirajMkScraper,
    NajdiraboataMkScraper,
    VrabotiSeScraper,
    JobsComMkScraper,
    OglasizarabotaMkScraper,
    ThrivityMkScraper,
    HonorarecMkScraper,
    ImashchoekMkScraper,
    ManpowerMkScraper,
    MkjobComScraper,
]
