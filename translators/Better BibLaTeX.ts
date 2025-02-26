declare const Zotero: any

import { Translator } from './lib/translator'
export { Translator }

import { Reference } from './bibtex/reference'
import { Exporter } from './bibtex/exporter'

Reference.prototype.fieldEncoding = {
  groups: 'verbatim', // blegh jabref field
  url: 'url',
  doi: 'verbatim',
  eprint: 'verbatim',
  eprintclass: 'verbatim',
  crossref: 'raw',
  xdata: 'raw',
  xref: 'raw',
  entrykey: 'raw',
  childentrykey: 'raw',
  verba: 'verbatim',
  verbb: 'verbatim',
  verbc: 'verbatim',
  institution: 'literal',
  publisher: 'literal',
  origpublisher: 'literal',
  organization: 'literal',
  location: 'literal',
  origlocation: 'literal',
}
Reference.prototype.caseConversion = {
  title: true,
  series: true,
  shorttitle: true,
  origtitle: true,
  booktitle: true,
  maintitle: true,
  eventtitle: true,
}

Reference.prototype.lint = require('./bibtex/biber-tool.conf')

type CreatorArray = any[] & { type?: string }

Reference.prototype.addCreators = function() {
  if (!this.item.creators || !this.item.creators.length) return

  const creators: Record<string, CreatorArray> = {
    author: [],
    bookauthor: [],
    commentator: [],
    editor: [],
    editora: [],
    editorb: [],
    holder: [],
    translator: [],
    // scriptwriter: [],
    // director: [],
  }
  creators.editora.type = 'collaborator'
  creators.editorb.type = 'redactor'

  for (const creator of this.item.creators) {
    switch (creator.creatorType) {
      case 'director':
        // 365.something
        if (['video', 'movie'].includes(this.referencetype)) {
          creators.editor.push(creator)
          creators.editor.type = 'director'
        }
        else {
          creators.author.push(creator)
        }
        break

      case 'author':
      case 'inventor':
      case 'interviewer':
      case 'programmer':
      case 'artist':
      case 'podcaster':
      case 'presenter':
        creators.author.push(creator)
        break

      case 'bookAuthor':
        creators.bookauthor.push(creator)
        break

      case 'commenter':
        creators.commentator.push(creator)
        break

      case 'editor':
        creators.editor.push(creator)
        break

      case 'assignee':
        creators.holder.push(creator)
        break

      case 'translator':
        creators.translator.push(creator)
        break

      case 'seriesEditor':
        creators.editorb.push(creator)
        break

      case 'scriptwriter':
        // 365.something
        creators.editora.push(creator)
        if (['video', 'movie'].includes(this.referencetype)) {
          creators.editora.type = 'scriptwriter'
        }
        break

      default:
        creators.editora.push(creator)
    }
  }

  for (const [field, value] of Object.entries(creators)) {
    this.remove(field)
    this.remove(`${field}type`)

    if (!value.length) continue

    this.add({ name: field, value, enc: 'creators' })
    if (value.type) this.add({ name: `${field}type`, value: value.type })
  }
}

Reference.prototype.typeMap = {
  csl: {
    article               : 'article',
    'article-journal'     : 'article',
    'article-magazine'    : {type: 'article', subtype: 'magazine'},
    'article-newspaper'   : {type: 'article', subtype: 'newspaper'},
    bill                  : 'legislation',
    book                  : 'book',
    broadcast             : {type: 'misc', subtype: 'broadcast'},
    chapter               : 'incollection',
    data                  : 'dataset',
    dataset               : 'dataset',
    entry                 : 'inreference',
    'entry-dictionary'    : 'inreference',
    'entry-encyclopedia'  : 'inreference',
    figure                : 'image',
    graphic               : 'image',
    interview             : {type: 'misc', subtype: 'interview'},
    legal_case            : 'jurisdiction',
    legislation           : 'legislation',
    manuscript            : 'unpublished',
    map                   : {type: 'misc', subtype: 'map'},
    motion_picture        : 'movie',
    musical_score         : 'audio',
    pamphlet              : 'booklet',
    'paper-conference'    : 'inproceedings',
    patent                : 'patent',
    personal_communication: 'letter',
    post                  : 'online',
    'post-weblog'         : 'online',
    report                : 'report',
    review                : 'review',
    'review-book'         : 'review',
    song                  : 'music',
    speech                : {type: 'misc', subtype: 'speech'},
    thesis                : 'thesis',
    treaty                : 'legal',
    webpage               : 'online',
  },
  zotero: {
    artwork            : 'artwork',
    audioRecording     : 'audio',
    bill               : 'legislation',
    blogPost           : 'online',
    book               : 'book',
    bookSection        : 'incollection',
    case               : 'jurisdiction',
    computerProgram    : 'software',
    conferencePaper    : 'inproceedings',
    dictionaryEntry    : 'inreference',
    document           : 'misc',
    email              : 'letter',
    encyclopediaArticle: 'inreference',
    film               : 'movie',
    forumPost          : 'online',
    gazette            : 'jurisdiction',
    hearing            : 'jurisdiction',
    instantMessage     : 'misc',
    interview          : 'misc',
    journalArticle     : 'article',
    letter             : 'letter',
    magazineArticle    : {type: 'article', subtype: 'magazine'},
    manuscript         : 'unpublished',
    map                : 'misc',
    newspaperArticle   : {type: 'article', subtype: 'newspaper'},
    patent             : 'patent',
    podcast            : 'audio',
    presentation       : 'unpublished',
    radioBroadcast     : 'audio',
    report             : 'report',
    statute            : 'legislation',
    thesis             : 'thesis',
    tvBroadcast        : 'video',
    videoRecording     : 'video',
    webpage            : 'online',
  },
}

function looks_like_number(n): string | boolean {
  if (n.match(/^(?=[MDCLXVI])M*(C[MD]|D?C*)(X[CL]|L?X*)(I[XV]|V?I*)$/)) return 'roman'
  if (n.match(/^[A-Z]?[0-9]+(\.[0-9]+)?$/i)) return 'arabic'
  if (n.match(/^[A-Z]$/i)) return 'arabic'
  return false
}
function looks_like_number_field(n: string): boolean {
  if (!n) return false

  const ns: string[] = n.trim().split(/\s*-+|–|,|\/\s*/)
  switch (ns.length) {
    case 1:
      return (looks_like_number(ns[0]) as boolean)

    case 2:
      return (looks_like_number(ns[0]) as boolean) && (looks_like_number(ns[0]) === looks_like_number(ns[1]))

    default:
      return false
  }
}

const patent = new class {
  private countries = ['de', 'eu', 'fr', 'uk', 'us']
  private prefix = {us: 'us', ep: 'eu', gb: 'uk', de: 'de', fr: 'fr' }

  public region(item): string {
    if (item.itemType !== 'patent') return ''

    if (item.country) {
      const country: string = item.country.toLowerCase()
      if (this.countries.includes(country)) return country
    }

    for (const patentNumber of [item.number, item.applicationNumber]) {
      if (patentNumber) {
        const prefix: string = this.prefix[patentNumber.substr(0, 2).toLowerCase()]
        if (prefix) return prefix
      }
    }

    return ''
  }

  // eslint-disable-next-line id-blacklist
  public number(item): string {
    if (item.itemType !== 'patent' || (!item.number && !item.applicationNumber)) return ''

    for (const patentNumber of ([item.number, item.applicationNumber] as string[])) {
      if (patentNumber) {
        const country = patentNumber.substr(0, 2).toLowerCase()
        if (this.prefix[country]) return patentNumber.substr(country.length)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return item.number || item.applicationNumber
  }

  public type(item) {
    if (item.itemType !== 'patent') return ''

    const region = this.region(item)

    if (region && item.number) return `patent${region}`
    if (region && item.applicationNumber) return `patreq${region}`

    return 'patent'
  }
}

export function doExport(): void {
  Translator.init('export')
  Reference.installPostscript()
  Exporter.prepare_strings()

  // Zotero.write(`\n% ${Translator.header.label}\n`)
  Zotero.write('\n')

  for (const item of Exporter.items) {
    const ref = new Reference(item)

    if (ref.referencetype === 'incollection' && ref.hasCreator('bookAuthor')) ref.referencetype = 'inbook'
    // if (ref.referencetype_source === 'csl.book' && !ref.hasCreator('author') && ref.hasCreator('editor')) ref.referencetype = 'collection'
    if (ref.referencetype === 'book' && item.numberOfVolumes) ref.referencetype = 'mvbook'
    if (ref.referencetype === 'report' && item.type?.toLowerCase().includes('manual')) ref.referencetype = 'manual'

    if (Translator.preferences.biblatexExtractEprint) {
      let m
      if (item.url && (m = item.url.match(/^https?:\/\/www.jstor.org\/stable\/([\S]+)$/i))) {
        ref.override({ name: 'eprinttype', value: 'jstor'})
        ref.override({ name: 'eprint', value: m[1].replace(/\?.*/, '') })
        ref.remove('archiveprefix')
        ref.remove('primaryclass')
        delete item.url
        ref.remove('url')

      }
      else if (item.url && (m = item.url.match(/^https?:\/\/books.google.com\/books?id=([\S]+)$/i))) {
        ref.override({ name: 'eprinttype', value: 'googlebooks'})
        ref.override({ name: 'eprint', value: m[1] })
        ref.remove('archiveprefix')
        ref.remove('primaryclass')
        delete item.url
        ref.remove('url')

      }
      else if (item.url && (m = item.url.match(/^https?:\/\/www.ncbi.nlm.nih.gov\/pubmed\/([\S]+)$/i))) {
        ref.override({ name: 'eprinttype', value: 'pubmed'})
        ref.override({ name: 'eprint', value: m[1] })
        ref.remove('archiveprefix')
        ref.remove('primaryclass')
        delete item.url
        ref.remove('url')
      }
    }

    ref.add({ name: 'langid', value: ref.language })

    if (ref.referencetype === 'patent') {
      if (item.country && !patent.region(item)) ref.add({ name: 'location', value: item.country || item.extraFields.kv['publisher-place'] })
    }
    else if (ref.referencetype === 'unpublished' && item.itemType === 'presentation') {
      ref.add({ name: 'venue', value: item.place, enc: 'literal' })
    }
    else {
      ref.add({ name: 'location', value: item.place || item.extraFields.kv['publisher-place'] , enc: 'literal' })
    }

    /*
    if (ref.referencetype === 'inbook') {
      ref.add({ name: 'chapter', value: item.title })
    } else {
      ref.add({ name: 'title', value: item.title })
    }
    */
    ref.add({ name: 'title', value: item.title })

    ref.add({ name: 'edition', value: item.edition })
    // ref.add({ name: 'rights', value: item.rights })
    ref.add({ name: 'isbn', value: item.ISBN })
    ref.add({ name: 'issn', value: item.ISSN })

    ref.add({ name: 'url', value: item.url || item.extraFields.kv.url })
    ref.add({ name: 'doi', value: (item.DOI || item.extraFields.kv.DOI || '').replace(/^https?:\/\/doi.org\//i, '') })

    ref.add({ name: 'shorttitle', value: item.shortTitle })
    ref.add({ name: 'abstract', value: item.abstractNote?.replace(/\n+/g, ' ') })
    ref.add({ name: 'volumes', value: item.numberOfVolumes })
    ref.add({ name: 'version', value: item.versionNumber })

    ref.add({ name: 'eventtitle', value: item.conferenceName })
    ref.add({ name: 'eventtitle', value: item.meetingName, replace: true })

    ref.add({ name: 'pagetotal', value: item.numPages })

    const number_added = ref.add({ name: 'number', value: patent.number(item) || item.number || item.seriesNumber })
    ref.add({ name: !number_added && looks_like_number_field(item.issue) ? 'number' : 'issue', value: item.issue })

    switch (ref.referencetype) {
      case 'jurisdiction':
        ref.add({ name: 'journaltitle', value: item.reporter || (item.publicationTitle !== item.title && item.publicationTitle), bibtexStrings: true })
        break

      case 'legislation':
        ref.add({ name: 'journaltitle', value: item.code || (item.publicationTitle !== item.title && item.publicationTitle), bibtexStrings: true })
        break

      case 'incollection':
      case 'chapter':
      case 'inproceedings':
      case 'inreference':
      case 'movie':
      case 'video':
      case 'inbook':
        if (!ref.has.booktitle) ref.add({ name: 'booktitle', value: item.publicationTitle, bibtexStrings: true })
        break

      case 'online':
        ref.add({ name: 'organization', value: item.publicationTitle, bibtexStrings: true })
        break

      case 'article':
        if (ref.getBibString(item.publicationTitle)) {
          ref.add({ name: 'journaltitle', value: item.publicationTitle, bibtexStrings: true })

        }
        else if (Translator.options.useJournalAbbreviation && item.publicationTitle && item.journalAbbreviation) {
          ref.add({ name: 'journaltitle', value: item.journalAbbreviation, bibtexStrings: true })

        }
        else {
          ref.add({ name: 'journaltitle', value: item.publicationTitle, bibtexStrings: true })

          if (ref.has.entrysubtype?.value === 'newspaper') {
            ref.add({ name: 'journalsubtitle', value: item.section })
          }
          else {
            ref.add({ name: 'shortjournal', value: item.journalAbbreviation, bibtexStrings: true })
          }
        }
        break

      default:
        if (!ref.has.journaltitle && (item.publicationTitle !== item.title)) ref.add({ name: 'journaltitle', value: item.publicationTitle })
    }

    let main
    // eslint-disable-next-line no-underscore-dangle
    if (item.multi?._keys?.title && (main = item.multi.main?.title || item.language)) {
      // eslint-disable-next-line no-underscore-dangle
      const languages = Object.keys(item.multi._keys.title).filter(lang => lang !== main)
      main += '-'
      languages.sort((a, b) => {
        if (a === b) return 0
        if (a.indexOf(main) === 0 && b.indexOf(main) !== 0) return -1
        if (a.indexOf(main) !== 0 && b.indexOf(main) === 0) return 1
        if (a < b) return -1
        return 1
      })
      for (let i = 0; i < languages.length; i++) {
        ref.add({
          name: i === 0 ? 'titleaddon' : `user${String.fromCharCode('d'.charCodeAt(0) + i)}`,
          // eslint-disable-next-line no-underscore-dangle
          value: item.multi._keys.title[languages[i]],
        })
      }
    }

    ref.add({ name: 'series', value: item.seriesTitle || item.series, bibtexStrings: true })

    switch (ref.referencetype) {
      case 'report':
      case 'thesis':
        ref.add({ name: 'institution', value: item.publisher, bibtexStrings: true })
        break

      case 'jurisdiction':
        ref.add({ name: 'institution', value: item.court, bibtexStrings: true })
        break

      case 'software':
        ref.add({ name: 'organization', value: item.publisher, bibtexStrings: true })
        break

      default:
        ref.add({ name: 'publisher', value: item.publisher, bibtexStrings: true })
    }

    switch (ref.referencetype) {
      case 'letter':
        ref.add({ name: 'type', value: item.type || (item.itemType === 'email' ? 'E-mail' : 'Letter') })
        break

      case 'thesis':
        ref.add({ name: 'type', value: ref.thesistype(item.type, 'phdthesis', 'mathesis', 'bathesis', 'candthesis')  || item.type })
        break

      case 'report':
        if (item.type?.toLowerCase().trim() === 'techreport') {
          ref.add({ name: 'type', value: 'techreport' })
        }
        else {
          ref.add({ name: 'type', value: item.type })
        }
        break

      case 'patent':
        ref.add({ name: 'type', value: patent.type(item) })
        break

      default:
        ref.add({ name: 'type', value: item.type })
    }

    if (ref.referencetype === 'unpublished' && item.itemType !== 'presentation') ref.add({ name: 'howpublished', value: item.type })

    if (item.accessDate && item.url) ref.add({ name: 'urldate', value: Zotero.BetterBibTeX.strToISO(item.accessDate), enc: 'date' })

    ref.add({
      name: 'date',
      verbatim: 'year',
      orig: { name: 'origdate', verbatim: 'origdate' },
      value: item.date,
      enc: 'date',
    })
    ref.add({
      name: 'origdate',
      value: item.originalDate,
      enc: 'date',
      replace: true, // #293 has both date="year [origyear]" and extra="original-date: origyear"
    })
    ref.add({ name: 'eventdate', value: item.conferenceDate, enc: 'date' })

    ref.add({ name: 'pages', value: ref.normalizeDashes(item.pages) })
    ref.add({ name: 'volume', value: ref.normalizeDashes(item.volume) })

    ref.add({ name: 'keywords', value: item.tags, enc: 'tags' })

    if (!item.creators) item.creators = []
    // https://github.com/retorquere/zotero-better-bibtex/issues/1060
    if (item.itemType === 'patent' && item.assignee && !item.creators.find(cr => cr.name === item.assignee || (cr.lastName === item.assignee && (cr.fieldMode === 1)))) {
      item.creators.push({
        name: item.assignee,
        creatorType: 'assignee',
      })
    }
    ref.addCreators()

    // 'juniorcomma' needs more thought, it isn't for *all* suffixes you want this. Or even at all.
    // ref.add({ name: 'options', value: (option for option in ['useprefix', 'juniorcomma'] when ref[option]).join(',') })

    if (ref.useprefix) ref.add({ name: 'options', value: 'useprefix=true' })

    ref.add({ name: 'file', value: item.attachments, enc: 'attachments' })

    if (item.volumeTitle) { // #381
      if (ref.referencetype === 'book' && ref.has.title) {
        ref.add({name: 'maintitle', value: item.volumeTitle }); // ; to prevent chaining
        [ref.has.title.bibtex, ref.has.maintitle.bibtex] = [ref.has.maintitle.bibtex, ref.has.title.bibtex]; // ; to prevent chaining
        [ref.has.title.value, ref.has.maintitle.value] = [ref.has.maintitle.value, ref.has.title.value]
      }

      if (['incollection', 'chapter'].includes(ref.referencetype) && ref.has.booktitle) {
        ref.add({name: 'maintitle', value: item.volumeTitle }); // ; to prevent chaining
        [ref.has.booktitle.bibtex, ref.has.maintitle.bibtex] = [ref.has.maintitle.bibtex, ref.has.booktitle.bibtex]; // ; to preven chaining
        [ref.has.booktitle.value, ref.has.maintitle.value] = [ref.has.maintitle.value, ref.has.booktitle.value]
      }
    }

    for (const eprinttype of ['pmid', 'arxiv', 'jstor', 'hdl', 'googlebooks']) {
      if (ref.has[eprinttype]) {
        if (!ref.has.eprinttype) {
          ref.add({ name: 'eprinttype', value: eprinttype})
          ref.add({ name: 'eprint', value: ref.has[eprinttype].value })
        }
        ref.remove(eprinttype)
      }
    }

    if (item.archive && item.archiveLocation) {
      let archive = true
      switch (item.archive.toLowerCase()) {
        case 'arxiv':
          if (!ref.has.eprinttype) ref.add({ name: 'eprinttype', value: 'arxiv' })
          ref.add({ name: 'eprintclass', value: item.callNumber })
          break

        case 'jstor':
          if (!ref.has.eprinttype) ref.add({ name: 'eprinttype', value: 'jstor' })
          break

        case 'pubmed':
          if (!ref.has.eprinttype) ref.add({ name: 'eprinttype', value: 'pubmed' })
          break

        case 'hdl':
          if (!ref.has.eprinttype) ref.add({ name: 'eprinttype', value: 'hdl' })
          break

        case 'googlebooks':
        case 'google books':
          if (!ref.has.eprinttype) ref.add({ name: 'eprinttype', value: 'googlebooks' })
          break

        default:
          archive = false
      }

      if (archive) {
        if (!ref.has.eprint) ref.add({ name: 'eprint', value: item.archiveLocation })
      }
    }

    if (item.arXiv && !ref.has.journaltitle && ref.referencetype === 'article') ref.referencetype = 'online'

    ref.complete()
  }

  Exporter.complete()
  Zotero.write('\n')
}
