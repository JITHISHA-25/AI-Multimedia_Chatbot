from pypdf import PdfReader

def extract_pdf_text(path):

    reader = PdfReader(path)

    text = ""

    for page in reader.pages:
        extracted = page.extract_text()

        if extracted:
            text += extracted

    return text